import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { ApiFactory } from '../../../../src/api/ApiFactory';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildAllergyBundle,
  buildMedicationOrderBundle,
  calculateTotalQuantity,
  MedicationOrderOptions,
} from '../../../../test-data/api/consultationBundlePayload';
import { DRUG_ORDER, DRUGS } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import { MedicationRequestEntry, MedicationEntry } from '../../../../src/api/types/fhir-resources.types';

const MED = DRUGS;

function assertMedOrder(req: MedicationRequestEntry | undefined, medicationUuid: string, opts: MedicationOrderOptions) {
  expect(req).toBeDefined();
  expect(req?.status).toBe('active');
  expect(req?.priority).toBe(opts.priority);
  expect(req?.medicationReference.reference).toContain(medicationUuid);
  expect(req?.dosageInstruction[0].route.coding[0].code).toBe(opts.route);
  expect(req?.dosageInstruction[0].doseAndRate[0].doseQuantity.value).toBe(opts.doseValue);
  expect(req?.dosageInstruction[0].doseAndRate[0].doseQuantity.code).toBe(opts.doseUnit);
  expect(req?.dosageInstruction[0].asNeededBoolean).toBe(opts.asNeededBoolean ?? false);
  expect(req?.dosageInstruction[0].timing?.code?.coding[0]?.code).toBe(opts.frequency);
  const startDate =
    req?.dosageInstruction[0].timing?.repeat?.boundsPeriod?.start ?? req?.dispenseRequest?.validityPeriod?.start;
  expect(startDate).toBeDefined();
  expect(req?.dispenseRequest.quantity.value).toBe(calculateTotalQuantity(opts));
}

test.describe.serial('POST medication orders — routes, dose units, formulations', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const { body } = await api.fhir.submitConsultationBundle(buildAllergyBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(body, 'Encounter');
  });

  const submitAndFind = async (api: ApiFactory, medicationUuid: string, opts: MedicationOrderOptions) => {
    await api.fhir.submitConsultationBundle(buildMedicationOrderBundle(ctx, encounterUuid, medicationUuid, opts));
    const { body } = await api.fhir.getMedicationRequests(ctx.patientUuid);
    const requests = getBundleEntriesByType<MedicationRequestEntry>(body, 'MedicationRequest');
    return requests.find((r) => r.medicationReference.reference.includes(medicationUuid));
  };

  test('Oral | Acetaminophen Tablet | 2 Tablet | Thrice a day | 5 Days | routine', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeOral,
      doseValue: 2,
      doseUnit: DRUG_ORDER.doseUnitTablet,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyThriceDaily,
      durationValue: 5,
      durationUcumCode: 'd',
    };
    assertMedOrder(await submitAndFind(api, MED.acetaminophenTablet, opts), MED.acetaminophenTablet, opts);
  });

  test('Intravenous | Acetaminophen Injection | 500 mg | Immediately | 2 Hours | stat', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeIntravenous,
      doseValue: 500,
      doseUnit: DRUG_ORDER.doseUnitMg,
      priority: 'stat',
      frequency: DRUG_ORDER.frequencyImmediate,
      durationValue: 2,
      durationUcumCode: 'h',
    };
    assertMedOrder(await submitAndFind(api, MED.acetaminophenInjection, opts), MED.acetaminophenInjection, opts);
  });

  test('Intramuscular | Anti-rabies vaccine Injection | 1 Unit | Immediately | 2 Hours | stat', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeIntramuscular,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitUnit,
      priority: 'stat',
      frequency: DRUG_ORDER.frequencyImmediate,
      durationValue: 2,
      durationUcumCode: 'h',
    };
    assertMedOrder(await submitAndFind(api, MED.antiRabiesVaccine, opts), MED.antiRabiesVaccine, opts);
  });

  test('Sub Cutaneous | Insulin Injection | 10 IU | Twice a day | 30 Days | routine', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeSubcutaneous,
      doseValue: 10,
      doseUnit: DRUG_ORDER.doseUnitIU,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyTwiceDaily,
      durationValue: 30,
      durationUcumCode: 'd',
    };
    assertMedOrder(await submitAndFind(api, MED.insulin, opts), MED.insulin, opts);
  });

  test('Inhalation | Isoflurane | 2 ml | Every 4 hours | 45 Minutes | routine | PRN', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeInhalation,
      doseValue: 2,
      doseUnit: DRUG_ORDER.doseUnitMl,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyEvery4Hours,
      durationValue: 45,
      durationUcumCode: 'min',
      asNeededBoolean: true,
    };
    assertMedOrder(await submitAndFind(api, MED.isoflurane, opts), MED.isoflurane, opts);
  });

  test('Sub Lingual | Nitroglycerin Sublingual tablet | 1 Tablet | Immediately | 2 Hours | stat', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeSublingual,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitTablet,
      priority: 'stat',
      frequency: DRUG_ORDER.frequencyImmediate,
      durationValue: 2,
      durationUcumCode: 'h',
    };
    assertMedOrder(await submitAndFind(api, MED.nitroglycerin, opts), MED.nitroglycerin, opts);
  });

  test('Nasogastric | Oral rehydration salts Powder | 1 Tablespoon | Four times a day | 3 Days | routine', async ({
    api,
  }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeNasogastric,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitTablespoon,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyFourTimesDaily,
      durationValue: 3,
      durationUcumCode: 'd',
    };
    assertMedOrder(await submitAndFind(api, MED.oralRehydrationSalts, opts), MED.oralRehydrationSalts, opts);
  });

  test('Per Rectum | Acetaminophen Suppository | 500 mg | Every 8 hours | 7 Days | routine', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routePerRectum,
      doseValue: 500,
      doseUnit: DRUG_ORDER.doseUnitMg,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyEvery8Hours,
      durationValue: 7,
      durationUcumCode: 'd',
    };
    assertMedOrder(await submitAndFind(api, MED.acetaminophenSuppository, opts), MED.acetaminophenSuppository, opts);
  });

  test('Nasal | Xylometazoline Nasal solution | 2 Drop | Once a week | 4 Weeks | routine', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeNasal,
      doseValue: 2,
      doseUnit: DRUG_ORDER.doseUnitDrop,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyOnceWeekly,
      durationValue: 4,
      durationUcumCode: 'wk',
    };
    assertMedOrder(await submitAndFind(api, MED.xylometazoline, opts), MED.xylometazoline, opts);
  });

  test('Topical | Lidocaine Gel | 10 mg | Twice a week | 2 Weeks | routine', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeTopical,
      doseValue: 10,
      doseUnit: DRUG_ORDER.doseUnitMg,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyTwiceWeekly,
      durationValue: 2,
      durationUcumCode: 'wk',
    };
    assertMedOrder(await submitAndFind(api, MED.lidocaineGel, opts), MED.lidocaineGel, opts);
  });

  test('Per Vaginal | Clotrimazole Pessary | 1 Teaspoon | Every 12 hours | 2 Months | routine', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routePerVaginal,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitTeaspoon,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyEvery12Hours,
      durationValue: 2,
      durationUcumCode: 'mo',
    };
    assertMedOrder(await submitAndFind(api, MED.clotrimazolePessary, opts), MED.clotrimazolePessary, opts);
  });

  test('Intradermal | Thiopental Powder for injection | 0.1 ml | On alternate days | 30 Minutes | routine', async ({
    api,
  }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeIntradermal,
      doseValue: 0.1,
      doseUnit: DRUG_ORDER.doseUnitMl,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyAlternateDays,
      durationValue: 30,
      durationUcumCode: 'min',
    };
    assertMedOrder(await submitAndFind(api, MED.thiopental, opts), MED.thiopental, opts);
  });

  test('Intraperitoneal | Amoxicillin Oral capsule | 1 Capsule | Every 2 hours | 6 Hours | routine', async ({
    api,
  }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeIntraperitoneal,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitCapsule,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyEvery2Hours,
      durationValue: 6,
      durationUcumCode: 'h',
    };
    assertMedOrder(await submitAndFind(api, MED.amoxicillinCapsule, opts), MED.amoxicillinCapsule, opts);
  });

  test('Intrathecal | Diltiazem Sustained-release tablet | 1 Tablet | Every 3 weeks | 3 Months | routine', async ({
    api,
  }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeIntrathecal,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitTablet,
      priority: 'routine',
      frequency: DRUG_ORDER.frequencyEvery3Weeks,
      durationValue: 3,
      durationUcumCode: 'mo',
    };
    assertMedOrder(await submitAndFind(api, MED.diltiazem, opts), MED.diltiazem, opts);
  });

  test('Intraosseous | Epinephrine Injection | 1 mg | Immediately | 2 Hours | stat', async ({ api }) => {
    const opts: MedicationOrderOptions = {
      route: DRUG_ORDER.routeIntraosseous,
      doseValue: 1,
      doseUnit: DRUG_ORDER.doseUnitMg,
      priority: 'stat',
      frequency: DRUG_ORDER.frequencyImmediate,
      durationValue: 2,
      durationUcumCode: 'h',
    };
    assertMedOrder(await submitAndFind(api, MED.epinephrine, opts), MED.epinephrine, opts);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

test.describe.serial('GET /fhir2/R4/Medication — medication search', () => {
  test('search with 3-char name returns matching medications', async ({ api }) => {
    const { status, body } = await api.fhir.searchMedication('par', 20);
    const medications = getBundleEntriesByType<MedicationEntry>(body, 'Medication');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(medications.length).toBeGreaterThan(0);
    const matching = medications.filter((m) => m.code.coding[0]?.display?.toLowerCase().includes('par'));
    expect(matching.length).toBeGreaterThan(0);
  });

  test('search with 1-char name returns results', async ({ api }) => {
    const { status, body } = await api.fhir.searchMedication('p', 10);
    const medications = getBundleEntriesByType<MedicationEntry>(body, 'Medication');

    expect(status).toBe(200);
    expect(medications.length).toBeGreaterThan(0);
  });

  test('_count param limits the number of returned medications', async ({ api }) => {
    const COUNT = 5;
    const { body } = await api.fhir.searchMedication('a', COUNT);
    const medications = getBundleEntriesByType<MedicationEntry>(body, 'Medication');

    expect(medications.length).toBeLessThanOrEqual(COUNT);
  });
});
