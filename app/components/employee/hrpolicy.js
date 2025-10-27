'use client';

import React from 'react';

const HR_POLICY = `
# Human Resources (HR) Policy

## 1. Purpose
This HR Policy outlines the standards, expectations, and procedures governing employment, workplace behavior, and people operations at the Company. It is designed to create a safe, fair, and productive work environment.

## 2. Equal Opportunity & Non-Discrimination
The Company is an equal opportunity employer. All employment decisions are based on merit, qualifications, and business needs. Discrimination or harassment of any kind is strictly prohibited.

## 3. Recruitment & Hiring
- Job postings will describe role, responsibilities, and required qualifications.
- Candidates will be selected based on objective criteria and consistent interviews.
- Background and reference checks may be conducted where appropriate.

## 4. Working Hours & Attendance
- Standard working hours: 9:00 AM to 6:00 PM (or as defined in your contract).
- Regular attendance and punctuality are expected. Absence should be reported to the manager as early as possible.

## 5. Leave Policy
- Annual leave, sick leave, parental leave, and other statutory leaves will be provided as per local laws and Company policy.
- Leave requests should be submitted in the HR portal with adequate notice when possible.

## 6. Compensation & Benefits
- Employees will receive salary and benefits as outlined in their employment contracts.
- Payroll queries should be raised with HR/payroll within 30 days of the pay date.

## 7. Performance Management
- Regular performance reviews will be conducted.
- Goals and KPIs will be discussed and documented.

## 8. Training & Development
- The Company supports continuous learning and may provide access to training and development resources.

## 9. Health & Safety
- The Company will maintain a safe work environment. Employees must follow safety procedures and report hazards.

## 10. Confidentiality & Data Protection
- Employees must protect confidential Company information and personal data of colleagues and clients.
- Access to sensitive data is on a need-to-know basis.

## 11. Separation & Exit
- Notice periods and exit procedures are governed by the employment contract and applicable local laws.
- Exit interviews may be conducted to capture feedback.

## 12. Policy Amendments
- The Company reserves the right to modify policies. Employees will be notified of significant changes.
`;

const TERMS = `
# Terms & Conditions

## 1. Acceptance
By using the Company's internal systems or accepting employment, you agree to these Terms & Conditions.

## 2. Scope
These Terms apply to employment, internal systems usage, and any services the Company provides to employees.

## 3. User Obligations
- Use systems lawfully and responsibly.
- Do not misuse Company resources or data.

## 4. Intellectual Property
- Work produced in the course of employment is the intellectual property of the Company unless otherwise agreed in writing.

## 5. Privacy
- The Company collects and processes personal data to manage employment and comply with legal obligations.
- Data will be handled according to the Company’s privacy policy and local data protection laws.

## 6. Termination
- The Company may terminate employment in accordance with contract terms and applicable laws.

## 7. Liability
- The Company limits liability to the extent allowed by law. Employees must follow security and compliance rules.

## 8. Governing Law
- These Terms are governed by the laws of the jurisdiction in which the Company is incorporated or operates, unless stated otherwise.
`;

const CODE_OF_CONDUCT = `
# Code of Conduct

## 1. Respect & Professionalism
- Treat colleagues, customers, and partners with respect.
- Maintain professional behavior in all interactions.

## 2. Anti-Harassment & Bullying
- Harassment, bullying, or discriminatory conduct will not be tolerated.
- Reports of harassment will be handled promptly and confidentially.

## 3. Confidentiality
- Protect confidential information and do not disclose it without authorization.

## 4. Conflicts of Interest
- Disclose any actual or potential conflicts of interest to your manager or HR.

## 5. Use of Company Resources
- Use Company assets responsibly. Personal use should be reasonable and not interfere with work.

## 6. Social Media
- Employees should not publish confidential information on social media or present personal views as Company positions.

## 7. Compliance & Ethics
- Follow laws, regulations, and internal policies. Report unethical conduct through provided channels.

## 8. Dress & Workplace Etiquette
- Dress appropriately for your role and maintain a clean and safe workspace.

## 9. Disciplinary Measures
- Violations may lead to warnings, suspension, or termination depending on severity.
`;

function mdToHtml(md) {
    return md
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold mt-6">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-medium mt-4">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-3">$1</h3>')
        .replace(/\n\n/g, '<p class="mt-2">')
        .replace(/\n/g, '<br/>')
        .replace(/\*\- /g, '<li>')
        .replace(/\n\- /g, '<li>');
}

export default function HRPolicy() {
    const downloadFile = (filename, content) => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="min-h-screen bg-white w-full p-6 text-gray-900">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Company Policies</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            HR Policy • Terms & Conditions • Code of Conduct
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => downloadFile('HR_POLICY.md', HR_POLICY)}
                            className="px-4 py-2 rounded-md border bg-white/80 hover:bg-white/90 shadow-sm text-sm"
                        >
                            Download HR Policy
                        </button>
                        <button
                            onClick={() => downloadFile('TERMS_AND_CONDITIONS.md', TERMS)}
                            className="px-4 py-2 rounded-md border bg-white/80 hover:bg-white/90 shadow-sm text-sm"
                        >
                            Download T&C
                        </button>
                        <button
                            onClick={() => downloadFile('CODE_OF_CONDUCT.md', CODE_OF_CONDUCT)}
                            className="px-4 py-2 rounded-md border bg-white/80 hover:bg-white/90 shadow-sm text-sm"
                        >
                            Download Code of Conduct
                        </button>
                    </div>
                </header>

                <section className="space-y-10 bg-white/60 p-6 rounded-2xl shadow">
                    <article id="hr-policy" className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: mdToHtml(HR_POLICY) }} />
                    </article>

                    <article id="terms" className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: mdToHtml(TERMS) }} />
                    </article>

                    <article id="code-of-conduct" className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: mdToHtml(CODE_OF_CONDUCT) }} />
                    </article>
                </section>

                <footer className="mt-8 text-sm text-gray-600">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p className="mt-2">
                        Need changes? Update the content constants at the top of this file to customize any section.
                    </p>
                </footer>
            </div>
        </main>
    );
}
