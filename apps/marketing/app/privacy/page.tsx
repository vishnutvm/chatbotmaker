"use client";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white">
            <SiteHeader />

            <section className="pt-32 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 dark:text-white">Privacy Policy</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-12">Last updated: November 22, 2025</p>

                    <div className="space-y-12 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
                            <p>
                                Welcome to ChatbotMaker ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
                            <p className="mb-4">
                                We collect information that you provide directly to us when you register for an account, create a chatbot, or contact us for support. This may include:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                                <li>Personal identification information (Name, email address, phone number, etc.)</li>
                                <li>Account credentials (usernames, passwords)</li>
                                <li>Payment information (processed securely by our third-party payment processors)</li>
                                <li>Content you upload to train your chatbots (PDFs, text, URLs)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
                            <p className="mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                                <li>Provide, operate, and maintain our services</li>
                                <li>Improve, personalize, and expand our platform</li>
                                <li>Understand and analyze how you use our services</li>
                                <li>Process your transactions and manage your orders</li>
                                <li>Send you emails, including account updates and marketing communications</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
                            <p>
                                We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our services is at your own risk.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Third-Party Services</h2>
                            <p>
                                We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: payment processing, data analysis, email delivery, hosting services, customer service, and marketing efforts.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Contact Us</h2>
                            <p>
                                If you have questions or comments about this policy, you may email us at <a href="mailto:privacy@chatbotmaker.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">privacy@chatbotmaker.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
