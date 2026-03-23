/**
 * email.ts
 *
 * Universal email sender built on a SINGLE EmailJS template.
 * To add a new email type, just add a new helper function at the bottom
 * that builds the 9 template variables and calls sendEmail().
 *
 * ─── Template variables ────────────────────────────────────────
 *  {{headline}}      – Main heading inside the email
 *  {{badge_text}}    – Small chip label (e.g. "Group Invitation")
 *  {{badge_bg}}      – Badge background colour  (hex/rgba string)
 *  {{badge_color}}   – Badge text colour         (hex string)
 *  {{badge_accent}}  – Top accent-bar colour on the detail card
 *  {{body_text}}     – Intro paragraph (plain text or inline HTML)
 *  {{details_rows}}  – Raw HTML <tr> rows inside the detail card
 *  {{cta_text}}      – Button label
 *  {{cta_url}}       – Button / link URL
 *  {{footer_note}}   – Small grey footer sentence
 *  {{to_email}}      – Recipient address (EmailJS "To Email" field)
 * ───────────────────────────────────────────────────────────────
 */
import emailjs from '@emailjs/browser';

// ── Internal helper ────────────────────────────────────────────────────────
function detailRow(label: string, value: string, last = false): string {
    const border = last ? '' : 'border-bottom:1px solid #e2e8f0;';
    return `
        <tr>
          <td style="padding:9px 0;${border}font-size:13px;color:#64748b;">${label}</td>
          <td style="padding:9px 0;${border}font-size:14px;font-weight:700;color:#1e293b;text-align:right;">${value}</td>
        </tr>`;
}

// ── Core send function ─────────────────────────────────────────────────────
interface EmailPayload {
    to_email: string;
    headline: string;
    badge_text: string;
    badge_bg: string;
    badge_color: string;
    badge_accent: string;
    body_text: string;
    details_rows: string;   // raw HTML <tr> rows
    cta_text: string;
    cta_url: string;
    footer_note: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        console.warn('[CrowdPay Email] Not configured — skipping send.', payload);
        return false;
    }

    try {
        await emailjs.send(serviceId, templateId, payload as unknown as Record<string, string>, publicKey);
        return true;
    } catch (err) {
        console.error('[CrowdPay Email] Send failed:', err);
        return false;
    }
};

// ══════════════════════════════════════════════════════════════════════════
//  EMAIL TYPE HELPERS
//  Each function builds the template variables for one email type.
//  To add a new type: copy a helper, change the content, done.
// ══════════════════════════════════════════════════════════════════════════

// ── 1. Group Invitation ────────────────────────────────────────────────────
export interface InviteEmailParams {
    to_email: string;
    inviter_name: string;
    jar_name: string;
    jar_goal: string;
    jar_frequency: string;
    jar_category?: string;
    invite_link: string;
}

export const sendInviteEmail = (p: InviteEmailParams) =>
    sendEmail({
        to_email: p.to_email,
        headline: `${p.inviter_name} invited you to join a Savings Jar 🎉`,
        badge_text: 'Group Invitation',
        badge_bg: 'rgba(219,234,254,0.25)',
        badge_color: '#bfdbfe',
        badge_accent: 'linear-gradient(90deg,#1e3a8a,#1d4ed8)',
        body_text: `<strong>${p.inviter_name}</strong> has invited you to join <strong>"${p.jar_name}"</strong> on CrowdPay — secure group savings where every member must unanimously agree before any funds are released.`,
        details_rows: [
            detailRow('Jar Name', p.jar_name),
            detailRow('Category', p.jar_category ?? 'Savings'),
            detailRow('Target Goal', p.jar_goal),
            detailRow('Frequency', p.jar_frequency, true),
        ].join(''),
        cta_text: 'Accept Invitation',
        cta_url: p.invite_link,
        footer_note: "You're receiving this because someone invited you to CrowdPay.",
    });

// ── 2. Withdrawal Vote Request ─────────────────────────────────────────────
//    Sent to all members except the requester.
export interface VoteRequestEmailParams {
    to_email: string;
    requester_name: string;
    jar_name: string;
    amount: string;
    reason: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    voting_link: string;
    deadline: string;        // e.g. "13 Mar 2026, 11:00 PM"
}

export const sendVoteRequestEmail = (p: VoteRequestEmailParams) =>
    sendEmail({
        to_email: p.to_email,
        headline: `${p.requester_name} has requested a withdrawal`,
        badge_text: 'Vote Required',
        badge_bg: 'rgba(254,243,199,0.35)',
        badge_color: '#fbbf24',
        badge_accent: 'linear-gradient(90deg,#d97706,#f59e0b)',
        body_text: `<strong>${p.requester_name}</strong> has submitted a payout request for <strong>${p.amount}</strong> from the <strong>"${p.jar_name}"</strong> jar. Review the details below and cast your vote — <strong>100% consensus is required</strong> before funds are released.`,
        details_rows: [
            detailRow('Jar Name', p.jar_name),
            detailRow('Amount Requested', p.amount),
            detailRow('Reason', p.reason),
            detailRow('Bank', p.bank_name),
            detailRow('Account Name', p.account_name),
            detailRow('Account Number', p.account_number),
            detailRow('Voting Deadline', p.deadline, true),
        ].join(''),
        cta_text: 'Cast My Vote',
        cta_url: p.voting_link,
        footer_note: `You're receiving this because you're a member of the "${p.jar_name}" jar.`,
    });

// ── 3. Vote Result — Approved ──────────────────────────────────────────────
export interface VoteApprovedEmailParams {
    to_email: string;
    recipient_name: string;    // the person who gets the money
    jar_name: string;
    amount: string;
    bank_name: string;
    account_name: string;
}

export const sendVoteApprovedEmail = (p: VoteApprovedEmailParams) =>
    sendEmail({
        to_email: p.to_email,
        headline: 'All members approved — payout is being processed ✓',
        badge_text: 'Approved',
        badge_bg: 'rgba(209,250,229,0.35)',
        badge_color: '#34d399',
        badge_accent: 'linear-gradient(90deg,#059669,#34d399)',
        body_text: `Every member of <strong>"${p.jar_name}"</strong> has voted to approve the withdrawal. The payout of <strong>${p.amount}</strong> to <strong>${p.recipient_name}</strong> is now being processed.`,
        details_rows: [
            detailRow('Jar Name', p.jar_name),
            detailRow('Amount', p.amount),
            detailRow('Recipient', p.recipient_name),
            detailRow('Payout Bank', p.bank_name),
            detailRow('Account Name', p.account_name, true),
        ].join(''),
        cta_text: 'View Jar',
        cta_url: 'https://crowdpayweb.vercel.app/groups',
        footer_note: `You're receiving this as a member of the "${p.jar_name}" jar.`,
    });

// ── 4. Vote Result — Declined ──────────────────────────────────────────────
export interface VoteDeclinedEmailParams {
    to_email: string;
    jar_name: string;
    amount: string;
    declined_by: string;
    decline_reason: string;
}

export const sendVoteDeclinedEmail = (p: VoteDeclinedEmailParams) =>
    sendEmail({
        to_email: p.to_email,
        headline: 'Withdrawal request was declined',
        badge_text: 'Declined',
        badge_bg: 'rgba(254,226,226,0.35)',
        badge_color: '#f87171',
        badge_accent: 'linear-gradient(90deg,#dc2626,#f87171)',
        body_text: `The withdrawal request of <strong>${p.amount}</strong> from <strong>"${p.jar_name}"</strong> was declined by <strong>${p.declined_by}</strong>. The funds remain safely in the jar. The group can discuss and submit a new request at any time.`,
        details_rows: [
            detailRow('Jar Name', p.jar_name),
            detailRow('Amount Requested', p.amount),
            detailRow('Declined By', p.declined_by),
            detailRow('Reason', p.decline_reason, true),
        ].join(''),
        cta_text: 'Go to Jar',
        cta_url: 'https://crowdpayweb.vercel.app/groups',
        footer_note: `You're receiving this as a member of the "${p.jar_name}" jar.`,
    });

// ── 5. Ajo Turn Notification ───────────────────────────────────────────────
//    Sent to the member whose turn it is in the Ajo rotation.
export interface AjoTurnEmailParams {
    to_email: string;
    member_name: string;
    jar_name: string;
    round_number: number;
    pot_amount: string;
    request_link: string;
}

export const sendAjoTurnEmail = (p: AjoTurnEmailParams) =>
    sendEmail({
        to_email: p.to_email,
        headline: `It's your turn! You're next to receive the pot 🎉`,
        badge_text: `Ajo Round ${p.round_number}`,
        badge_bg: 'rgba(219,234,254,0.25)',
        badge_color: '#93c5fd',
        badge_accent: 'linear-gradient(90deg,#1e3a8a,#0ea5e9)',
        body_text: `Hi <strong>${p.member_name}</strong>! It's your turn to receive the pot from <strong>"${p.jar_name}"</strong>. All members have completed their contributions for this cycle. Click below to submit your bank details and request the payout.`,
        details_rows: [
            detailRow('Jar Name', p.jar_name),
            detailRow('Your Round', `Round ${p.round_number}`),
            detailRow('Pot Amount', p.pot_amount, true),
        ].join(''),
        cta_text: 'Request My Payout',
        cta_url: p.request_link,
        footer_note: `You're receiving this because it's your turn in the "${p.jar_name}" Ajo rotation.`,
    });
