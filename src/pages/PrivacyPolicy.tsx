import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white shadow rounded-lg mt-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, submit a form, or communicate with us. This may include your name, email address, and the details of your requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, including to process your requests, communicate with you, and manage your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Storage & Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. No Sale of Data</h2>
          <p>
            We do not sell your personal information to third parties. Your data is used solely for the purpose of providing our services to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. No Third-Party Sharing</h2>
          <p>
            We do not share your personal information with third parties except as necessary to provide our services (e.g., cloud hosting providers) or as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies Usage</h2>
          <p>
            We use essential cookies to ensure the proper functionality of this application, such as keeping you logged in. We do not use tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. User Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information. If you wish to delete your account or data, please contact us using the information below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@example.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
