declare module "*.json" {
  const value: any;
  export default value;
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: {
        navigation: any;
        auth: any;
        settings: any;
        dashboard: any;
        interview: any;
        profile: any;
        history: any;
        common: any;
        languages: any;
      };
    };
  }
}
