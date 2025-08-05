export enum NavigationType {
  Full = "full",
  FullRedirect = "full-redirect",
  SPA = "spa",
  SPAReplace = "spa-replace",
}

export const ALL_NAVIGATION_TYPES: NavigationType[] = [
  NavigationType.Full,
  NavigationType.FullRedirect,
  NavigationType.SPA,
  NavigationType.SPAReplace,
];
