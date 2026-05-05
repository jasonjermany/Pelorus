<template>
  <div class="min-h-screen bg-white text-gray-900">
    <AppHeader variant="marketing" />

    <!-- Hero -->
    <div class="bg-navy pt-28 pb-16 px-6 md:px-12">
      <div class="max-w-[760px] mx-auto">
        <p class="text-[12px] font-bold tracking-[0.12em] uppercase text-white mb-3">Legal</p>
        <h1 class="text-[clamp(28px,4vw,44px)] font-bold text-white leading-[1.1] tracking-[-1px] mb-4">Privacy Policy</h1>
        <p class="text-[15px] text-white">Pelorus Signal LLC · Effective April 2026 · Version 1.0 · Questions: <a href="mailto:privacy@pelorusai.com" class="text-white hover:text-accent-400 transition-colors no-underline">privacy@pelorusai.com</a></p>
      </div>
    </div>

    <!-- Content -->
    <div class="content px-6 md:px-12 py-14 md:py-20">
      <div class="max-w-[760px] mx-auto flex flex-col gap-12">

        <section>
          <h2>1. Introduction</h2>
          <p>This Privacy Policy describes how Pelorus Signal LLC ("Pelorus," "we," "our," or "us") collects, uses, stores, and protects information in connection with our AI-powered submission triage platform for property and casualty insurers (the "Services").</p>
          <p>Pelorus is a B2B service provider. Our customers are insurance carriers, managing general agents, and related entities ("Customers"). This Policy governs how we handle data submitted to us by Customers in the course of using our Services.</p>
          <p>This Policy does not apply to the internal data practices of our Customers. Each Customer is independently responsible for its own data handling with respect to its policyholders, applicants, and other individuals.</p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <h3>2.1 Customer Data (Submission Documents)</h3>
          <p>When Customers use the Services, they upload insurance submission documents for AI-assisted triage analysis. These documents may include:</p>
          <ul>
            <li>ACORD forms and broker cover letters</li>
            <li>Schedules of value (SOVs), loss runs, and claims history</li>
            <li>Inspection reports, site surveys, and engineering assessments</li>
            <li>Supplemental applications and supporting underwriting materials</li>
            <li>Any other documents submitted as part of an insurance application package</li>
          </ul>
          <p>These documents are referred to collectively as "Submission Documents" or "Customer Data." Submission Documents may contain personal information about insurance applicants, insureds, employees, and other individuals — including names, addresses, financial data, and loss history. Pelorus processes this information solely as a data processor on behalf of the Customer.</p>

          <h3>2.2 Carrier Guidelines</h3>
          <p>Customers upload their proprietary underwriting guidelines, appetite statements, and referral trigger rules ("Carrier Guidelines") to configure the Services. Carrier Guidelines are treated as highly confidential Customer Data and are subject to the strongest protections in this Policy.</p>

          <h3>2.3 Account and Usage Data</h3>
          <p>We collect basic account information (name, email address, organization) to operate the platform. We also collect limited technical data — including session tokens, platform usage logs, and error reports — solely for the purpose of providing and improving the Services.</p>

          <h3>2.4 No Collection of Personal Consumer Data</h3>
          <p>Pelorus does not collect personal data directly from insurance consumers, policyholders, or applicants. Any personal information that appears in Submission Documents is collected by the Customer in its capacity as the data controller, not by Pelorus.</p>
        </section>

        <section>
          <h2>3. How We Use Customer Data</h2>
          <p>Pelorus uses Customer Data for one purpose: delivering the Services to the Customer who uploaded that data. Specifically, we use Customer Data to:</p>
          <ul>
            <li>Analyze Submission Documents against the Customer's Carrier Guidelines</li>
            <li>Generate triage reports, risk scores, hard stop analyses, coverage gap assessments, and plain-English summaries ("Output")</li>
            <li>Operate platform functionality including document storage, session management, and Output delivery</li>
            <li>Provide customer support and respond to technical issues</li>
          </ul>
          <p>We do not use Customer Data for any secondary purpose, including product development, marketing, benchmarking, or training machine learning models.</p>
        </section>

        <section>
          <h2>4. Absolute Prohibitions</h2>
          <p>The following uses of Customer Data are strictly prohibited and will never occur:</p>
          <ul class="prohibitions">
            <li>Training or fine-tuning any AI or machine learning model using Customer Data or Submission Documents</li>
            <li>Using Customer Data or Carrier Guidelines to inform outputs for any other customer</li>
            <li>Disclosing, licensing, selling, or sharing Customer Data with any third party for commercial purposes</li>
            <li>Using Carrier Guidelines, submission patterns, or underwriting logic to develop competitive intelligence or benchmark products</li>
            <li>Aggregating Customer Data across customers to create industry datasets or risk models</li>
          </ul>
          <p>These prohibitions apply without exception. They are not subject to opt-out, data processing agreements, or contractual carve-outs.</p>
        </section>

        <section>
          <h2>5. Sharing and Disclosure</h2>

          <h3>5.1 No Sale of Data</h3>
          <p>Pelorus does not sell, rent, or license Customer Data to any third party under any circumstances.</p>

          <h3>5.2 Subprocessors</h3>
          <p>Pelorus uses a limited number of third-party subprocessors to operate the Services — including cloud infrastructure providers and AI inference providers. All subprocessors are bound by data processing agreements that prohibit secondary use of Customer Data. A current list of subprocessors is available upon written request.</p>

          <h3>5.3 Legal Requirements</h3>
          <p>We may disclose Customer Data if required to do so by applicable law, regulation, or valid legal process. Where legally permissible, we will provide the affected Customer with prior notice before any such disclosure.</p>

          <h3>5.4 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of substantially all of Pelorus's assets, Customer Data may be transferred to the acquiring entity, subject to the same protections as this Policy. We will notify affected Customers in advance of any such transfer.</p>
        </section>

        <section>
          <h2>6. Data Residency and International Transfers</h2>
          <p>Customer Data is processed and stored within the United States. Pelorus does not transfer Customer Data outside the United States without Customer's prior written consent.</p>
          <p>If a Customer requires specific data residency commitments — such as state-level data segregation or compliance with New York DFS cybersecurity regulations — those requirements should be addressed in the applicable Order Form or a separate Data Processing Addendum.</p>
        </section>

        <section>
          <h2>7. Data Retention and Deletion</h2>

          <h3>7.1 Active Term Retention</h3>
          <p>Pelorus retains Customer Data for the duration of the applicable Agreement and for a period not to exceed ninety (90) days following termination or expiration, after which Customer Data is securely deleted or returned as directed by Customer.</p>

          <h3>7.2 Backup Retention</h3>
          <p>Pelorus may retain Customer Data in secure, encrypted backup archives for up to thirty (30) additional days beyond the standard deletion window, solely for disaster recovery purposes. Data in backup archives remains subject to all confidentiality and no-training obligations.</p>

          <h3>7.3 Deletion Requests</h3>
          <p>Customers may request deletion of their Customer Data at any time by written notice. Pelorus will complete the deletion within thirty (30) days of receipt, subject to any obligations to retain data under applicable law.</p>

          <h3>7.4 Customer Retention of Output</h3>
          <p>Customers may retain Output for their own legitimate internal business, compliance, and regulatory purposes. Retained Output may not be used to reverse engineer, replicate, or develop a competing service that incorporates Pelorus's analytical methodology, scoring framework, or prompt architecture.</p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>Pelorus implements and maintains commercially reasonable administrative, technical, and physical safeguards to protect Customer Data. Our measures include:</p>
          <ul>
            <li>Encryption of Customer Data in transit (TLS 1.2 or higher) and at rest</li>
            <li>Access controls limiting Customer Data access to personnel required to deliver the Services</li>
            <li>Audit logging of access to Customer Data</li>
            <li>Regular review of security controls and subprocessor compliance</li>
          </ul>
          <p>Pelorus will provide Customers with reasonable information about its security practices upon written request and will cooperate with Customer's vendor security assessment process.</p>

          <h3>8.1 Breach Notification</h3>
          <p>In the event of a confirmed security breach involving Customer Data, Pelorus will notify the affected Customer without undue delay, and in no event later than five (5) business days after becoming aware of the confirmed breach. Notification will describe the nature of the breach, the categories of data affected, and Pelorus's response and remediation steps.</p>
        </section>

        <section>
          <h2>9. Customer Responsibilities as Data Controller</h2>
          <p>For Submission Documents containing personal information of insurance applicants, insureds, or other individuals, Customer acts as the data controller. Customer is solely responsible for:</p>
          <ul>
            <li>Ensuring it has a lawful basis to upload such personal information to the Services</li>
            <li>Providing any required notices to data subjects regarding AI-assisted processing</li>
            <li>Complying with applicable data protection laws, including state insurance privacy regulations, CCPA, NYDFS cybersecurity regulations, and similar state frameworks</li>
            <li>Responding to data subject requests (access, deletion, correction) with respect to personal data contained in Submission Documents</li>
          </ul>
          <p>Pelorus processes personal information within Submission Documents solely as a data processor acting on Customer's instructions, and solely for the purpose of delivering the Services.</p>
        </section>

        <section>
          <h2>10. Cookies and Tracking</h2>
          <p>The Pelorus platform uses session cookies and similar technologies solely for authentication and platform functionality. We do not use advertising cookies, behavioral tracking, or third-party analytics cookies. No Customer Data or Submission content is shared with advertising or analytics platforms.</p>
        </section>

        <section>
          <h2>11. Policy Updates</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices, applicable law, or the Services. We will notify Customers of material changes at least thirty (30) days in advance by email or platform notification. Continued use of the Services after the effective date of an updated Policy constitutes acceptance of the updated terms.</p>
          <p>Customers operating under a signed Agreement that contains specific data processing terms should note that those contractual terms control over this Policy to the extent of any conflict.</p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>For questions about this Privacy Policy, data handling practices, subprocessor requests, or to submit a data deletion request:</p>
          <ul>
            <li><strong>Email</strong> — <a href="mailto:privacy@pelorusai.com">privacy@pelorusai.com</a></li>
            <li><strong>Mail</strong> — Pelorus Signal LLC, Boston, Massachusetts</li>
            <li><strong>Web</strong> — <a href="https://pelorusai.com">pelorusai.com</a></li>
          </ul>
        </section>

        <!-- Footer note -->
        <div class="pt-8 border-t border-gray-100 text-[13px] text-gray-500">
          Pelorus Signal LLC · Boston, Massachusetts · pelorusai.io · Version 1.0 · April 2026
        </div>

      </div>
    </div>

    <!-- Page footer -->
    <footer class="border-t border-gray-100 px-6 md:px-12 py-10">
      <div class="max-w-[760px] mx-auto flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2 no-underline">
          <img src="/PelorusLogo.png" width="22" height="22" alt="Pelorus mark" />
          <img src="/PelorusWordmark.png" height="14" alt="Pelorus" class="h-[14px] w-auto" />
        </NuxtLink>
        <span class="text-[13px] text-gray-500">© 2026 Pelorus Signal LLC</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy — Pelorus',
  meta: [{ name: 'description', content: 'Privacy Policy for Pelorus Signal LLC. How we collect, use, store, and protect data submitted to our AI-powered underwriting triage platform.' }],
})
</script>

<style scoped>
.content section {
  @apply flex flex-col gap-4;
}

.content h2 {
  @apply text-[22px] font-bold text-gray-900 tracking-[-0.4px] pb-3 border-b border-gray-100;
}

.content h3 {
  @apply text-[16px] font-bold text-gray-900 mt-2;
}

.content p {
  @apply text-[16px] text-gray-700 leading-[1.75];
}

.content ul {
  @apply flex flex-col gap-2 pl-0 list-none;
}

.content ul li {
  @apply text-[16px] text-gray-700 leading-[1.75] pl-5 relative;
}

.content ul li::before {
  content: '·';
  @apply absolute left-0 text-gray-400 font-bold;
}

.content ul.prohibitions li::before {
  content: '×';
  @apply absolute left-0 text-red-400 font-bold;
}

.content a {
  @apply text-[#92700A] hover:text-[#78580A] underline underline-offset-2 transition-colors;
}

.content strong {
  @apply font-semibold text-gray-800;
}
</style>
