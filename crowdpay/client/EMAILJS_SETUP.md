# EmailJS Setup Guide for CrowdPay

You will need to create a **Service**, a **Template**, and get your **Public Key** from the EmailJS dashboard.

## 1. Setup in EmailJS Dashboard

1. Go to [EmailJS](https://www.emailjs.com/) and create a free account.
2. Add a new Email Service (e.g., connect your Gmail). Note the **Service ID** (e.g., `service_xxxxx`).
3. Go to **Email Templates** and create a new template. Note the **Template ID** (e.g., `template_xxxxx`).
4. Go to **Account** > **API Keys** and note your **Public Key** (e.g., `public_xxxxx`).

## 2. The Email Template

In the EmailJS Template editor, use this exact structure:

**Subject:**
`You've been invited to join the {{jar_name}} Jar on CrowdPay!`

**Content:**

```
Hello!

{{inviter_name}} has invited you to join their contribution group, "{{jar_name}}", on CrowdPay.

Jar Goal: {{jar_goal}}
Frequency: {{jar_frequency}}

Click the link below to accept the invitation and join the group:
{{invite_link}}

Warm regards,
The CrowdPay Team
```

### Explanation of Variables:

EmailJS looks for anything inside `{{ }}` and replaces it with the data we send from the React app. We will send the following variables from our code:

- `jar_name`: The name of the Jar being joined.
- `inviter_name`: The name of the user who sent the invite.
- `jar_goal`: The target amount (e.g., ₦500,000).
- `jar_frequency`: The frequency (e.g., Monthly).
- `invite_link`: The URL the user should click to accept (e.g., `https://crowdpay.com/invite/12345`).

## 3. Environment Variables

Add these 3 keys to your `.env` file in the CrowdPay project:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

That's it! Our application will automatically pick up these keys and send the emails when you invite a member.
