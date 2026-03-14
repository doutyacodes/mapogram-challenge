import { NextResponse } from 'next/server';
import { countryCenters } from '../../utils/countryCenters';

// const countryCenters = {
//   'US': { lat: 39.8283, lng: -98.5795 },
//   'IN': { lat: 20.5937, lng: 78.9629 },
//   'GB': { lat: 55.3781, lng: -3.4360 },
//   'CA': { lat: 56.1304, lng: -106.3468 },
//   'AU': { lat: -25.2744, lng: 133.7751 },
//   'DE': { lat: 51.1657, lng: 10.4515 },
//   'FR': { lat: 46.2276, lng: 2.2137 },
//   'BR': { lat: -14.2350, lng: -51.9253 },
//   'CN': { lat: 35.8617, lng: 104.1954 },
//   'JP': { lat: 36.2048, lng: 138.2529 },
// };

export async function GET(request) {
  try {
    const geoip = await import('geoip-lite');

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip;

    if (ip === '127.0.0.1' || ip === '::1' || !ip) {
      return NextResponse.json({
        country: 'IN',
        center: countryCenters['IN'],
      });
    }

    const geo = geoip.default.lookup(ip);
    const countryCode = geo ? geo.country : 'IN';

    return NextResponse.json({
      country: countryCode,
      center: countryCenters[countryCode] || countryCenters['IN'],
    });
  } catch (error) {
    console.error('GeoIP lookup failed:', error);
    return NextResponse.json({
      country: 'IN',
      center: countryCenters['IN'],
    });
  }
}
