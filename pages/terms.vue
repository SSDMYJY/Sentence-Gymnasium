<template>
    <div class="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <div class="hero-rise">
            <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">Legal Documents</p>
            <h1 class="mt-3 font-display text-4xl font-bold tracking-tight">Terms and Conditions</h1>
            <p class="mt-3 text-sm text-stone-500">Last updated: July 6, 2026</p>

            <!-- 当用户的语言不是英文时，显示该信息 -->
            <p v-if="!['en'].includes($i18n.locale)" class="mt-3 text-sm text-red-400">
                <span v-if="['zh-hans'].includes($i18n.locale)">
                    本条款和条件的官方版本仅提供英文版本。若你需要当前语言的版本，请联系我们。
                </span>
                <span v-else-if="['zh-hant'].includes($i18n.locale)">
                    本條款和條件的官方版本僅提供英文版本。若你需要當前語言的版本，請聯繫我們。
                </span>
                <span v-else-if="['ja'].includes($i18n.locale)">
                    本利用規約の公式版は英語版のみです。現在の言語のバージョンが必要な場合は、お問い合わせください。
                </span>
            </p>

            <div class="mt-12 space-y-12">
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">01</span> Introduction
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Welcome to <strong class="text-stone-200">Sentence Gymnasium</strong> ("we," "our," or "us").
                        These Terms and
                        Conditions ("Terms") govern your access to and use of our AI-powered multilingual sentence
                        training platform, available at [website URL] (the "Service"), operated by MFJip612 ("the
                        Operator").
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        By accessing or using the Service, you agree to be bound by these Terms. If you are under 18
                        years of age, you represent that you have the consent of a parent or legal guardian to use the
                        Service. If you do not agree to these Terms, you must not access or use the Service.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">02</span> Description of Service
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Sentence Gymnasium is an AI-driven language learning platform focused on English and Japanese
                        sentence training. Our core service provides a closed-loop workflow of question generation, user
                        response, AI-powered evaluation, and personalized feedback, designed to help users develop
                        instinctive sentence construction skills through deliberate practice.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any
                        time, with or without notice. We shall not be liable to you or any third party for any
                        modification, suspension, or discontinuation.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">03</span> Account Registration and Security
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">To access certain features of the Service,
                        you may be required to register for an account. You
                        agree to provide accurate, current, and complete information during registration and to update
                        such information to keep it accurate, current, and complete.</p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">You are responsible for safeguarding your
                        account credentials and for all activities that occur
                        under your account. You agree to notify us immediately of any unauthorized use of your account
                        or any other breach of security.</p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">We support third-party single sign-on (SSO)
                        authentication (e.g., Google, Github) as an
                        alternative registration method. By using SSO, you also agree to the terms and privacy policies
                        of the respective third-party provider.</p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">04</span> Subscription and Payments
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">Certain features of the Service may require
                        payment of fees. All fees are displayed in the applicable currency and are exclusive of
                        applicable taxes unless stated otherwise.</p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400"><strong class="text-stone-200">Refund
                            Policy:</strong> All payments
                        made for subscriptions or one-time purchases are final. We do not offer refunds except where
                        required by applicable law. By completing a purchase, you acknowledge and agree to this
                        no-refund policy.</p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">We use third-party payment processors to
                        handle payment transactions. Your use of these services is subject to their respective terms and
                        privacy policies.</p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">05</span> User Conduct and Prohibited Activities
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">You agree not to use the Service for any
                        unlawful purpose or in any way that could damage, disable, overburden, or impair the Service.
                        Specifically, you agree not to:</p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li>Use the Service to generate, distribute, or store content that is illegal, harmful,
                            threatening, abusive, harassing, defamatory, obscene, or otherwise objectionable;</li>
                        <li>Attempt to gain unauthorized access to any portion of the Service or any systems or networks
                            connected to the Service;</li>
                        <li>Use any automated means (including bots, scrapers, or spiders) to access or interact with
                            the Service;</li>
                        <li>Reverse engineer, decompile, or disassemble any aspect of the Service;</li>
                        <li>Interfere with or disrupt the integrity or performance of the Service;</li>
                        <li>Use the Service to develop a competing product or service.</li>
                    </ul>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">06</span> Intellectual Property Rights
                    </h2>
                    <h3 class="mt-6 text-sm font-semibold text-stone-200">6.1 Platform Content</h3>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">All content, features, and functionality of
                        the Service, including but not limited to text,
                        graphics, logos, icons, images, audio clips, software, and AI-generated feedback, are owned by
                        us or our licensors and are protected by international copyright, trademark, and other
                        intellectual property laws.</p>

                    <h3 class="mt-6 text-sm font-semibold text-stone-200">6.2 User Input</h3>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">You retain all ownership rights to the
                        sentences, text, and other content you input into the
                        Service ("User Input"). By submitting User Input, you grant us a non-exclusive, worldwide,
                        royalty-free license to use, process, and store such content solely for the purpose of providing
                        and improving the Service.</p>

                    <h3 class="mt-6 text-sm font-semibold text-stone-200">6.3 AI-Generated Output</h3>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">All content generated by our AI systems,
                        including but not limited to questions, evaluations,
                        corrections, explanations, and feedback ("AI Output"), is the property of Sentence Gymnasium.
                        You are granted a limited, non-exclusive, non-transferable license to use AI Output for your
                        personal learning purposes only. You may not redistribute, sell, or commercially exploit AI
                        Output without our prior written consent.</p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">07</span> Third-Party Services
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">The Service currently integrates with
                        self-hosted AI/ML models for sentence evaluation and feedback generation. We may integrate
                        additional third-party services in the future, including but not limited to payment processors,
                        analytics providers, and authentication services.</p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">Your use of any third-party services is
                        governed by their respective terms and privacy policies. We are not responsible for the
                        practices or content of any third-party services.</p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">08</span> Disclaimer of Warranties
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
                        EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
                        FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We do not warrant that: (a) the Service will be uninterrupted, secure, or error-free; (b) the
                        results obtained from using the Service will be accurate or reliable; (c) any errors in the
                        Service will be corrected.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        AI-generated feedback and evaluations are provided for educational purposes only and should not
                        be considered definitive or authoritative. We encourage users to consult qualified language
                        instructors for formal language assessment.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">09</span> Limitation of Liability
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY
                        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
                        LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO
                        OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Our total liability to you for all claims arising from or relating to these Terms or the Service
                        shall not exceed the amount you paid to us, if any, in the twelve (12) months preceding the
                        event giving rise to liability.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">10</span> Indemnification
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        You agree to indemnify, defend, and hold harmless MFJip612 and its affiliates, officers,
                        directors, employees, and agents from and against any claims, liabilities, damages, losses, and
                        expenses, including reasonable attorneys' fees, arising out of or in any way connected with your
                        access to or use of the Service, your violation of these Terms, or your violation of any rights
                        of another.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">11</span> Termination
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We may terminate or suspend your account and access to the Service immediately, without prior
                        notice or liability, for any reason, including but not limited to a breach of these Terms.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Upon termination, your right to use the Service will immediately cease. All provisions of these
                        Terms which by their nature should survive termination shall survive, including but not limited
                        to ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">12</span> Governing Law and Dispute Resolution
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        These Terms shall be governed and construed in accordance with the laws of <strong>Hong Kong
                            Special Administrative Region</strong>, without
                        regard to its conflict of law provisions.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Any dispute arising out of or relating to these Terms or the Service shall first be attempted to
                        be resolved through good-faith negotiation. If negotiation fails, the dispute shall be resolved
                        through binding arbitration in accordance with the rules of <strong>Hong Kong International
                            Arbitration Centre (HKIAC)</strong>.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">13</span> Changes to Terms
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We reserve the right to modify or replace these Terms at any time. If a revision is material, we
                        will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a
                        material change will be determined at our sole discretion.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        By continuing to access or use the Service after any revisions become effective, you agree to be
                        bound by the revised Terms.
                    </p>
                </section>

                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">14</span> Severability
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of
                        competent jurisdiction, such provision shall be eliminated or limited to the minimum extent
                        necessary, and the remaining provisions shall continue in full force and effect.
                    </p>
                </section>
            </div>

            <div class="mt-16 border-t border-white/5 pt-8">
                <NuxtLink :to="localePath('/')" class="text-sm text-stone-400 transition-colors hover:text-white">
                    ← Back Home
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ i18n: false })

const localePath = useLocalePath()
</script>