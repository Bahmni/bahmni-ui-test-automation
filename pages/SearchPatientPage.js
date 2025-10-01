export class SearchPatientPage {
  constructor(page) {
    this.page = page;
    this.searchQueryInput = '#search_query';
    this.searchButton = '#search-button';
    this.searchResult = '.search-result';
  }

  async navigateToSearch() {
    await this.page.goto('https://example.com/patient/search');
  }

  async searchPatient(query) {
    await this.page.fill(this.searchQueryInput, query);
    await this.page.click(this.searchButton);
  }

  async getSearchResult() {
    return await this.page.textContent(this.searchResult);
  }
}

export default SearchPatientPage;
