// app/landing/page.js
'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Build Your Network, <br />
              <span className="text-yellow-600">Earn Commissions</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Join our MLM platform and start building your downline. Watch your network grow and earn commissions as your team expands.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/mlm/register"
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-md font-medium"
              >
                Join Now
              </Link>
              <Link
                href="/mlm/login"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Existing Member Login
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required. Start for free.</p>
          </div>
          <div className="hidden md:block">
            <img
              src="/images/mlm-image.png"
              alt="MLM Illustration"
              className="rounded-lg shadow-xl h-[580px] w-full object-fit"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Powerful Features</h2>
            <p className="mt-2 text-gray-600">Everything you need to build and manage your MLM business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Visual Tree Structure</h3>
              <p className="mt-2 text-gray-600">View your entire network in an intuitive tree layout. Expand nodes to see your downline.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Commission Tracking</h3>
              <p className="mt-2 text-gray-600">Real‑time commission calculation based on your downline activity. Withdraw earnings anytime.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Referral System</h3>
              <p className="mt-2 text-gray-600">Invite new members with your unique referral code. Earn bonuses for every active downline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-2 text-gray-600">Start building your network in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">1</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Register</h3>
              <p className="mt-2 text-gray-600">Sign up with your personal details and choose a sponsor (or start as a root member).</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">2</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Build Your Team</h3>
              <p className="mt-2 text-gray-600">Invite others using your referral code. They become your downline and help you grow.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">3</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Earn Commissions</h3>
              <p className="mt-2 text-gray-600">Get paid based on your network size and sales. Level up as you reach promotion thresholds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-yellow-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Start Your MLM Journey?</h2>
          <p className="mt-4 text-yellow-100 max-w-2xl mx-auto">
            Join thousands of members who are already building successful networks and earning commissions.
          </p>
          <div className="mt-8">
            <Link
              href="/mlm/register"
              className="px-8 py-3 bg-white text-yellow-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md"
            >
              Sign Up Now – It's Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold">RealBeez</h3>
              <p className="mt-2 text-sm">Building networks, creating wealth.</p>
            </div>
            <div>
              <h4 className="text-white font-medium">Quick Links</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li><Link href="/mlm/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/mlm/register" className="hover:text-white">Register</Link></li>
                <li><Link href="/mlm/tree" className="hover:text-white">Tree View</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium">Support</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium">Contact</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Email: support@realbeez.com</li>
                <li>Phone: +91 12345 67890</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} RealBeez. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}