export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // ── Static fallback list (used locally or if Interswitch auth fails) ──
    const STATIC_BANKS = [
        { name: 'Access Bank', code: '044' }, { name: 'First Bank', code: '011' },
        { name: 'GT Bank', code: '058' }, { name: 'UBA', code: '033' },
        { name: 'Zenith Bank', code: '057' }, { name: 'Opay', code: '100004' },
        { name: 'Kuda Bank', code: '090267' }, { name: 'Moniepoint', code: '50515' },
        { name: 'Fidelity Bank', code: '070' }, { name: 'Sterling Bank', code: '232' },
        { name: 'Polaris Bank', code: '076' }, { name: 'Wema Bank', code: '035' },
        { name: 'Stanbic IBTC', code: '039' }, { name: 'Union Bank', code: '032' },
        { name: 'Ecobank', code: '050' }, { name: 'FCMB', code: '214' },
        { name: 'Keystone Bank', code: '082' }, { name: 'Providus Bank', code: '101' },
        { name: 'VFD Microfinance Bank', code: '090110' }, { name: 'PalmPay', code: '999991' },
    ];

    try {
        const clientId = process.env.INTERSWITCH_CLIENT_ID;
        const clientSecret = process.env.INTERSWITCH_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.warn('Interswitch credentials missing — serving static bank list');
            return res.status(200).json({ success: true, data: STATIC_BANKS });
        }

        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const tokenResponse = await fetch('https://qa.interswitchng.com/passport/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authHeader}`
            },
            body: new URLSearchParams({
                'scope': 'profile',
                'grant_type': 'client_credentials'
            })
        });

        if (!tokenResponse.ok) {
            console.warn(`Interswitch auth failed (Status: ${tokenResponse.status}) — serving static bank list`);
            return res.status(200).json({ success: true, data: STATIC_BANKS });
        }

        const tokenText = await tokenResponse.text();
        if (!tokenText) {
            console.warn('Interswitch auth returned empty body — serving static bank list');
            return res.status(200).json({ success: true, data: STATIC_BANKS });
        }
        
        const tokenData = JSON.parse(tokenText);
        const accessToken = tokenData.access_token;

        const bankResponse = await fetch('https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1/verify/identity/account-number/bank-list', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!bankResponse.ok) {
            console.warn(`Bank list fetch failed (Status: ${bankResponse.status}) — serving static bank list`);
            return res.status(200).json({ success: true, data: STATIC_BANKS });
        }

        const bankText = await bankResponse.text();
        if (!bankText) {
            console.warn('Bank list fetch returned empty body — serving static bank list');
            return res.status(200).json({ success: true, data: STATIC_BANKS });
        }

        const bankData = JSON.parse(bankText);

        if (!bankData.success) {
            console.warn('Bank list API reported failure — serving static bank list');
            return res.status(200).json({ success: true, data: STATIC_BANKS });
        }

        return res.status(200).json({ success: true, data: bankData.data });

    } catch (error) {
        console.error('Bank fetch error details:', error.name, error.message);
        // Graceful degradation — serve static list instead of crashing
        return res.status(200).json({ success: true, data: STATIC_BANKS });
    }
}
