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
        .replace(/^# (.*$)/gim, '<h1 class="text-xl sm:text-3xl font-semibold section-heading">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg sm:text-2xl font-medium mt-4">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-md sm:text-xl font-medium mt-3">$1</h3>')
        .replace(/\n\n/g, '<p class="mt-2 text-sm sm:text-base leading-relaxed">')
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
        <main className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-white sm:p-6 text-gray-900">
            <div className="w-full sm:max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Company Policies</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            HR Policy • Terms & Conditions • Code of Conduct
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => downloadFile('HR_POLICY.md', HR_POLICY)}
                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                        >
                            Download HR Policy
                        </button>
                        <button
                            onClick={() => downloadFile('TERMS_AND_CONDITIONS.md', TERMS)}
                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
                        >
                            Download T&C
                        </button>
                        <button
                            onClick={() => downloadFile('CODE_OF_CONDUCT.md', CODE_OF_CONDUCT)}
                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm"
                        >
                            Download Code of Conduct
                        </button>
                    </div>
                </header>

                {/* Policy Content */}
                <section className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow space-y-10">
                    {/* HR Policy */}
                    <article
                        id="hr-policy"
                        className="prose max-w-none"
                    >
                        <div
                            className="[&_.section-heading]:text-blue-600 [&_.section-heading]:border-b-2 [&_.section-heading]:border-blue-600 [&_.section-heading]:inline-block"
                            dangerouslySetInnerHTML={{ __html: mdToHtml(HR_POLICY) }}
                        />
                    </article>

                    {/* Terms & Conditions */}
                    <article
                        id="terms"
                        className="prose max-w-none"
                    >
                        <div
                            className="[&_.section-heading]:text-green-600 [&_.section-heading]:border-b-2 [&_.section-heading]:border-green-600 [&_.section-heading]:inline-block"
                            dangerouslySetInnerHTML={{ __html: mdToHtml(TERMS) }}
                        />
                    </article>

                    {/* Code of Conduct */}
                    <article
                        id="code-of-conduct"
                        className="prose max-w-none"
                    >
                        <div
                            className="[&_.section-heading]:text-amber-600 [&_.section-heading]:border-b-2 [&_.section-heading]:border-amber-600 [&_.section-heading]:inline-block"
                            dangerouslySetInnerHTML={{ __html: mdToHtml(CODE_OF_CONDUCT) }}
                        />
                    </article>
                </section>

                {/* Footer */}
                <footer className="text-xs sm:text-sm text-gray-600 text-center mt-10">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p className="mt-1">
                        Need changes? Update the content constants at the top of this file to customize any section.
                    </p>
                </footer>
            </div>
        </main>
    );
}