export default async function handler(req, res) {
    // 1. SET CORS HEADERS FIRST
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { accountNumber, bankCode, fullName } = req.body;

    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
        return res.status(400).json({ success: false, message: 'Invalid Account Number or missing Bank Code.' });
    }


    try {
        const clientId = process.env.INTERSWITCH_CLIENT_ID;
        const clientSecret = process.env.INTERSWITCH_CLIENT_SECRET;
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // 1. GET OAUTH ACCESS TOKEN
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

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            throw new Error(tokenData.description || 'Failed to obtain access token');
        }

        const accessToken = tokenData.access_token;

        // 2. VERIFY ACCOUNT DETAILS
        const verifyResponse = await fetch('https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1/verify/identity/account-number/resolve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                accountNumber,
                bankCode
            })
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || verifyData.responseCode === 'ERROR') {
            return res.status(400).json({
                success: false,
                message: verifyData.message || 'Account Verification Failed'
            });
        }

        if (!verifyData.data || !verifyData.data.bankDetails) {
            console.error('Interswitch Response Missing Data:', JSON.stringify(verifyData, null, 2));
            return res.status(400).json({
                success: false,
                message: verifyData.message || 'Interswitch returned an empty data object. Account could not be verified.'
            });
        }

        // 3. SUCCESS RESPONSE
        return res.status(200).json({
            success: true,
            data: {
                accountName: verifyData.data.bankDetails.accountName,
                accountNumber: verifyData.data.bankDetails.accountNumber,
                bankName: verifyData.data.bankDetails.bankName,
                message: 'Account verified successfully via Interswitch'
            }
        });

    } catch (error) {
        console.error('Interswitch Bank Verification Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error during bank verification' 
        });
    }
}
