import { expect } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { PatientData } from '../../test-data/patientData';

export class RegistrationActions {
  constructor(private readonly bahmni: PageFactory) {}

  async registerPatient(patientData: PatientData): Promise<string> {
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.REGISTRATION_NEW);
    await this.bahmni.registrationSearchPage.clickCreateNewPatientBtn();
    await this.bahmni.createPatientPage.createPatient({
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      gender: patientData.gender,
      dateOfBirth: patientData.dateOfBirth,
      middleName: patientData.middleName,
      phoneNumber: patientData.phoneNumber,
      email: patientData.email,
    });
    await this.bahmni.createPatientPage.fillAddressInformation(patientData.address);
    await this.bahmni.createPatientPage.savePatient();
    return this.bahmni.createPatientPage.getPatientId();
  }

  async registerPatientWithMandatoryDetails(patientData: PatientData): Promise<string> {
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.REGISTRATION_NEW);
    await this.bahmni.registrationSearchPage.clickCreateNewPatientBtn();
    await this.bahmni.createPatientPage.createPatient({
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      gender: patientData.gender,
      dateOfBirth: patientData.dateOfBirth,
    });
    await this.bahmni.createPatientPage.savePatient();
    return this.bahmni.createPatientPage.getPatientId();
  }

  async searchAndOpenPatient(patientId: string) {
    await this.bahmni.createPatientPage.clickSearchPatient();
    await this.bahmni.registrationSearchPage.searchAndOpenPatientById(patientId);
  }

  async editPatient(patientData: PatientData) {
    await this.bahmni.createPatientPage.fillBasicInformation(
      patientData.firstName,
      patientData.lastName,
      patientData.gender,
      patientData.dateOfBirth,
      patientData.middleName
    );
    await this.bahmni.createPatientPage.fillContactInformation(patientData.phoneNumber);
    await this.bahmni.createPatientPage.fillEmail(patientData.email);
    await this.bahmni.createPatientPage.fillAddressInformation(patientData.address);
  }

  async searchAndOpenPatientByName(firstName: string, lastName: string) {
    await this.bahmni.createPatientPage.clickSearchPatient();
    await this.bahmni.registrationSearchPage.searchAndOpenPatient(firstName, lastName);
  }

  async verifyPatientBasicInformation(patientData: PatientData) {
    expect(await this.bahmni.createPatientPage.getFirstName()).toBe(patientData.firstName);
    expect(await this.bahmni.createPatientPage.getMiddleName()).toBe(patientData.middleName);
    expect(await this.bahmni.createPatientPage.getLastName()).toBe(patientData.lastName);
    const gender = await this.bahmni.createPatientPage.getGender();
    expect(gender?.trim()).toContain(patientData.gender);
    expect(await this.bahmni.createPatientPage.getDateOfBirth()).toBe(patientData.dateOfBirth);
  }

  async verifyPatientContactInformation(phoneNumber: string, email: string) {
    expect(await this.bahmni.createPatientPage.getPhoneNumber()).toBe(phoneNumber);
    expect(await this.bahmni.createPatientPage.getEmail()).toBe(email);
  }

  async verifyPatientAddressInformation(address: PatientData['address']) {
    expect(await this.bahmni.createPatientPage.getHouseNumber()).toBe(address.houseNumber);
    expect(await this.bahmni.createPatientPage.getLocality()).toBe(address.locality);
    expect(await this.bahmni.createPatientPage.getCity()).toBe(address.city);
  }

  async verifyPatientRelationship(relationshipType: string, patientName: string) {
    const type = await this.bahmni.createPatientPage.getRelationshipType();
    expect(type?.trim()).toContain(relationshipType);
    const name = await this.bahmni.createPatientPage.getRelationshipPatientName();
    expect(name?.trim()).toContain(patientName);
  }
}
