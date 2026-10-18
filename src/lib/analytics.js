// The shipped app initialised react-ga with UA-116318007-1 and fired pageview on
// each route plus {category:"Covers"} events for Shuffled / Downloaded A Cover.
//
// That property belongs to the original site owner and Universal Analytics was
// retired in 2023, so this reconstruction keeps the call sites - they are part of
// the observable structure and the ledger binds obligations B18/B19 to them - but
// delivers nothing. Wiring a real endpoint here is a deliberate, documented gap.
export const analytics = {
  pageview(_path) {},
  event(_payload) {},
};

export default analytics;
