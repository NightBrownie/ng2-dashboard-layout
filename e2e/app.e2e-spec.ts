import { Ng2DashboardLayoutPage } from './app.po';

describe('ng2-dashboard-layout App', () => {
  let page: Ng2DashboardLayoutPage;

  beforeEach(() => {
    page = new Ng2DashboardLayoutPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
