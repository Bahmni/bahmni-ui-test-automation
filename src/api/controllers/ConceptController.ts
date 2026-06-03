import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { UserRole } from '../types/api.types';

type ConceptMapping = { display: string };

type ConceptResponse = { uuid: string; mappings?: ConceptMapping[] };

export class ConceptController extends BaseApiController {
  private readonly canonicalCodeCache = new Map<string, string>();

  /**
   * OpenMRS FHIR serializes a Concept's `code` using its canonical reference-terminology mapping
   * (SNOMED CT preferred, then CIEL, then any other source). When a test posts a Concept by UUID
   * and reads it back, the response `code` won't be the UUID — it'll be that mapping code.
   * This resolves the UUID to that expected code so assertions can round-trip.
   *
   * The v=full concept response leaves `conceptReferenceTerm.code` null but populates `display`
   * as "SOURCE: code" (e.g. "SNOMED-CT: 385055001"), so we parse the display string.
   */
  async getCanonicalCode(uuid: string, role: UserRole = 'admin'): Promise<string> {
    const cached = this.canonicalCodeCache.get(uuid);
    if (cached) return cached;

    const { body } = await this.get<ConceptResponse>(`${REST.concept}/${uuid}?v=full`, role);
    const parsed = (body.mappings ?? [])
      .map((m) => {
        const [source, code] = m.display.split(/:\s*/, 2);
        return { source: source?.toLowerCase() ?? '', code: code ?? '' };
      })
      .filter((m) => m.code);
    const preferred =
      parsed.find((m) => m.source.includes('snomed')) ?? parsed.find((m) => m.source === 'ciel') ?? parsed[0];
    const code = preferred?.code ?? uuid;
    this.canonicalCodeCache.set(uuid, code);
    return code;
  }
}
