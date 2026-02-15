import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Who Would Win Books",
  description: "Privacy policy for whowouldwinbooks.com",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 15, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
          <p>
            Welcome to Who Would Win Books (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated at
            whowouldwinbooks.com. We respect your privacy and are committed to protecting the personal
            information you share with us. This Privacy Policy explains how we collect, use, and
            safeguard your information when you visit our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">2. Information We Collect</h2>
          <p><strong>Account Information:</strong> When you create an account, we collect your email address and password.</p>
          <p><strong>Payment Information:</strong> If you purchase a membership, payment is processed securely through Stripe. We do not store your credit card details.</p>
          <p><strong>Usage Data:</strong> We automatically collect information about how you interact with our site, including pages visited, time spent, and device information.</p>
          <p><strong>Cookies:</strong> We use essential cookies for authentication and analytics cookies (Vercel Analytics) to improve our service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our service</li>
            <li>To process transactions and manage your account</li>
            <li>To improve our website and content</li>
            <li>To communicate with you about your account or our services</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">4. Children&apos;s Privacy</h2>
          <p>
            Our content is designed for children ages 5-12, but our website is intended to be used by
            parents, guardians, and educators. We do not knowingly collect personal information from
            children under 13. If you believe we have inadvertently collected such information, please
            contact us so we can promptly delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe</strong> — Payment processing</li>
            <li><strong>Supabase</strong> — Authentication and database</li>
            <li><strong>Vercel</strong> — Hosting and analytics</li>
          </ul>
          <p>Each of these services has their own privacy policy governing their use of your data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by
            posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:scoutyscout9@gmail.com" className="text-blue-600 hover:underline">
              scoutyscout9@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
