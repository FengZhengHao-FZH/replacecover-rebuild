// The shipped app read `isMobile` from a UA-detection package (vendor chunk exports
// t.isMobile). Only two effects are observable: the s-page gets `touch` instead of
// `no-touch`, canvas font-size is halved, and raster scale becomes devicePixelRatio.
// Computed once at module load, same as the original.
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const isMobile = typeof navigator !== 'undefined' && MOBILE_UA.test(navigator.userAgent || '');
