<template>
    <div class="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <div class="hero-rise">
            <p class="text-xs uppercase tracking-[0.28em] text-accent-soft">Legal Documents</p>
            <h1 class="mt-3 font-display text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p class="mt-3 text-sm text-stone-500">Last updated: July 6, 2026</p>

            <!-- 当用户的语言不是英文时，显示该信息 -->
            <p v-if="!['en'].includes($i18n.locale)" class="mt-3 text-sm text-red-400">
                <span v-if="['zh-hans'].includes($i18n.locale)">
                    本隐私政策的官方版本仅提供英文版本。若你需要当前语言的版本，请联系我们。
                </span>
                <span v-else-if="['zh-hant'].includes($i18n.locale)">
                    本隱私政策的官方版本僅提供英文版本。若你需要當前語言的版本，請聯繫我們。
                </span>
                <span v-else-if="['ja'].includes($i18n.locale)">
                    このプライバシーポリシーの公式版は英語のみで提供されています。現在の言語のバージョンが必要な場合は、お問い合わせください。
                </span>
            </p>

            <div class="mt-12 space-y-12">
                <!-- 01 Introduction -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">01</span> Introduction
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        MFJip612 ("we," "our," or "us") operates Sentence Gymnasium (the "Service"). This Privacy Policy
                        explains how we collect, use, disclose, and safeguard your information when you use our Service.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We are committed to protecting your privacy and handling your personal data with transparency
                        and care. By using the Service, you consent to the practices described in this Privacy Policy.
                    </p>
                </section>

                <!-- 02 Information We Collect -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">02</span> Information We Collect
                    </h2>
                    <h3 class="mt-6 text-sm font-semibold text-stone-200">2.1 Personal Information</h3>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We may collect the following categories of personal information:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li><strong class="text-stone-300">Contact Information:</strong> Name, email address, and other
                            information you provide during registration;</li>
                        <li><strong class="text-stone-300">Account Information:</strong> Username, password, profile
                            information, and account preferences;</li>
                        <li><strong class="text-stone-300">Payment Information:</strong> Billing address and payment
                            method details (processed by third-party payment processors; we do not store full payment
                            card numbers);</li>
                        <li><strong class="text-stone-300">User Content:</strong> Sentences, responses, and other
                            content you submit for AI evaluation and training purposes.</li>
                    </ul>
                    <h3 class="mt-6 text-sm font-semibold text-stone-200">2.2 Automatically Collected Information</h3>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        When you access or use the Service, we automatically collect certain information, including:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li><strong class="text-stone-300">Device Information:</strong> IP address, browser type,
                            operating system, device identifiers;</li>
                        <li><strong class="text-stone-300">Usage Data:</strong> Pages visited, features used, time spent
                            on the Service, clickstream data;</li>
                        <li><strong class="text-stone-300">Location Information:</strong> General geographic location
                            derived from your IP address;</li>
                        <li><strong class="text-stone-300">Cookies and Similar Technologies:</strong> We use cookies and
                            similar tracking technologies to enhance your experience and analyze Service usage.</li>
                    </ul>
                </section>

                <!-- 03 How We Use Your Information -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">03</span> How We Use Your Information
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We use the information we collect for the following purposes:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li>To provide, maintain, and improve the Service;</li>
                        <li>To process transactions and manage your subscriptions;</li>
                        <li>To generate personalized AI-powered feedback and learning recommendations;</li>
                        <li>To communicate with you about your account, updates, and promotional materials (with your
                            consent where required);</li>
                        <li>To monitor and analyze usage patterns and trends to improve user experience;</li>
                        <li>To detect, prevent, and address technical issues, fraud, and security incidents;</li>
                        <li>To comply with legal obligations and enforce our Terms and Conditions.</li>
                    </ul>
                </section>

                <!-- 04 Legal Basis for Processing -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">04</span> Legal Basis for Processing (GDPR and Similar Laws)
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        If you are located in the European Economic Area (EEA), the United Kingdom, or other
                        jurisdictions with similar data protection laws, we process your personal data based on the
                        following legal grounds:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li><strong class="text-stone-300">Performance of a Contract:</strong> Processing necessary to
                            provide the Service under our Terms and Conditions;</li>
                        <li><strong class="text-stone-300">Legitimate Interests:</strong> Processing necessary for our
                            legitimate interests, such as improving the Service and ensuring security, provided these
                            interests are not overridden by your rights;</li>
                        <li><strong class="text-stone-300">Consent:</strong> Processing based on your explicit consent,
                            which you may withdraw at any time;</li>
                        <li><strong class="text-stone-300">Legal Obligation:</strong> Processing necessary to comply
                            with applicable laws and regulations.</li>
                    </ul>
                </section>

                <!-- 05 How We Share Your Information -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">05</span> How We Share Your Information
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We do not sell your personal information. We may share your information in the following
                        circumstances:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li><strong class="text-stone-300">Service Providers:</strong> With third-party vendors and
                            service providers who perform services on our behalf, such as payment processing, data
                            analysis, email delivery, and customer support;</li>
                        <li><strong class="text-stone-300">AI Processing:</strong> User input data is processed through
                            our self-hosted AI/ML infrastructure. No personal data is shared with external AI service
                            providers;</li>
                        <li><strong class="text-stone-300">Legal Compliance:</strong> When required by law, regulation,
                            legal process, or governmental request;</li>
                        <li><strong class="text-stone-300">Business Transfers:</strong> In connection with a merger,
                            acquisition, or sale of assets, your information may be transferred as part of that
                            transaction;</li>
                        <li><strong class="text-stone-300">With Your Consent:</strong> We may share your information
                            with third parties when you have given us your explicit consent to do so.</li>
                    </ul>
                </section>

                <!-- 06 Data Storage and International Transfers -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">06</span> Data Storage and International Transfers
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Your information is stored and processed exclusively on infrastructure provided by <strong
                            class="text-stone-300">Cloudflare, Inc.</strong> and its affiliated services, including but
                        not limited to Cloudflare Workers, Cloudflare Pages, Cloudflare D1, Cloudflare R2, and
                        Cloudflare KV (collectively, the "Cloudflare Platform"). All aspects of the Service — including
                        application hosting, data storage, edge caching, and serverless computing — are deployed on the
                        Cloudflare Platform.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Due to the global nature of Cloudflare's network, your data may be processed and cached in edge
                        locations around the world to optimize performance and availability. By using the Service, you
                        acknowledge and consent to the transfer, storage, and processing of your information on
                        Cloudflare's global infrastructure, which may include data centers located outside your country
                        of residence.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Cloudflare acts as a data processor on our behalf. Our use of Cloudflare's services is governed
                        by Cloudflare's Data Processing Addendum and Privacy Policy. We have implemented appropriate
                        contractual safeguards to ensure that your personal data receives adequate protection in
                        accordance with this Privacy Policy, regardless of where it is processed.
                    </p>
                </section>

                <!-- 07 Data Retention -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">07</span> Data Retention
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We retain your personal information for as long as necessary to fulfill the purposes outlined in
                        this Privacy Policy, unless a longer retention period is required or permitted by law.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        When you request deletion of your account, we will delete or anonymize your personal data in
                        accordance with our data retention schedule, except where we are required to retain certain
                        information for legal, tax, or regulatory compliance purposes. Anonymized data may be retained
                        indefinitely for analytical and Service improvement purposes.
                    </p>
                </section>

                <!-- 08 Your Privacy Rights -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">08</span> Your Privacy Rights
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Depending on your location, you may have the following rights regarding your personal
                        information:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li><strong class="text-stone-300">Access:</strong> The right to request copies of your personal
                            data;</li>
                        <li><strong class="text-stone-300">Rectification:</strong> The right to request correction of
                            inaccurate or incomplete data;</li>
                        <li><strong class="text-stone-300">Erasure ("Right to be Forgotten"):</strong> The right to
                            request deletion of your personal data under certain conditions;</li>
                        <li><strong class="text-stone-300">Restriction:</strong> The right to request restriction of
                            processing under certain conditions;</li>
                        <li><strong class="text-stone-300">Data Portability:</strong> The right to request transfer of
                            your data to another controller;</li>
                        <li><strong class="text-stone-300">Objection:</strong> The right to object to processing based
                            on legitimate interests;</li>
                        <li><strong class="text-stone-300">Withdraw Consent:</strong> The right to withdraw consent at
                            any time where processing is based on consent.</li>
                    </ul>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        To exercise any of these rights, please contact us at <strong>info@netstd.eu.cc</strong>. We
                        will respond to your request within the timeframe required by applicable law.
                    </p>
                </section>

                <!-- 09 Children's Privacy -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">09</span> Children's Privacy
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Our Service is available to users of all ages, including children under the age of 13 (or the
                        applicable age of digital consent in your jurisdiction), provided they have obtained parental or
                        guardian consent.
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We do not knowingly collect personal information from children without verifiable parental
                        consent. If we learn that we have collected personal information from a child without
                        appropriate consent, we will take steps to delete that information as soon as possible. If you
                        believe we may have collected information from a child without proper consent, please contact us
                        immediately.
                    </p>
                </section>

                <!-- 10 Cookies and Tracking Technologies -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">10</span> Cookies and Tracking Technologies
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We use cookies and similar tracking technologies to collect and track information about your
                        browsing activities on our Service. You can instruct your browser to refuse all cookies or to
                        indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able
                        to use some portions of our Service.
                    </p>
                </section>

                <!-- 11 Security -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">11</span> Security
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We implement appropriate technical and organizational measures to protect your personal
                        information against unauthorized access, alteration, disclosure, or destruction. However, no
                        method of transmission over the Internet or electronic storage is 100% secure, and we cannot
                        guarantee absolute security.
                    </p>
                </section>

                <!-- 12 Third-Party Links -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">12</span> Third-Party Links
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        Our Service may contain links to third-party websites or services that are not owned or
                        controlled by us. We have no control over, and assume no responsibility for, the content,
                        privacy policies, or practices of any third-party websites or services.
                    </p>
                </section>

                <!-- 13 Changes to This Privacy Policy -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">13</span> Changes to This Privacy Policy
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        We may update this Privacy Policy from time to time. We will notify you of any changes by
                        posting the new Privacy Policy on this page and updating the "Last Updated" date. You are
                        advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
                        Policy are effective when they are posted on this page.
                    </p>
                </section>

                <!-- 14 California Privacy Rights -->
                <section>
                    <h2 class="font-display text-lg font-semibold text-stone-100">
                        <span class="text-accent-soft">14</span> California Privacy Rights (CCPA/CPRA)
                    </h2>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        If you are a California resident, you have specific rights regarding your personal information
                        under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA),
                        including:
                    </p>
                    <ul class="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-stone-400 list-disc">
                        <li>The right to know what personal information is being collected about you;</li>
                        <li>The right to know whether your personal information is sold or disclosed and to whom;</li>
                        <li>The right to say no to the sale of personal information (we do not sell personal
                            information);</li>
                        <li>The right to access your personal information;</li>
                        <li>The right to equal service and price, even if you exercise your privacy rights.</li>
                    </ul>
                    <p class="mt-3 text-sm leading-relaxed text-stone-400">
                        To exercise your California privacy rights, please contact us at
                        <strong>info@netstd.eu.cc</strong>.
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
