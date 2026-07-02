"use client";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white">
            <SiteHeader />

            <section className="pt-32 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 dark:text-white">Terms of Service</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-12">Last updated: November 22, 2025</p>

                    <div className="space-y-12 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using ChatbotMaker ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Description of Service</h2>
                            <p>
                                ChatbotMaker provides users with tools to build, train, and deploy AI-powered chatbots for their websites and applications. You understand and agree that the Service may include advertisements and that these advertisements are necessary for ChatbotMaker to provide the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. User Accounts</h2>
                            <p className="mb-4">
                                If you create an account on the Service, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account. You must immediately notify ChatbotMaker of any unauthorized uses of your account or any other breaches of security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Intellectual Property</h2>
                            <p>
                                The Service and its original content, features, and functionality are and will remain the exclusive property of ChatbotMaker and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Termination</h2>
                            <p>
                                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Changes to Terms</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Contact Us</h2>
                            <p>
                                If you have questions or comments about these Terms, please contact us at <a href="mailto:legal@chatbotmaker.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">legal@chatbotmaker.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
