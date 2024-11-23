import { PolicyLayout } from "@/components/policy-layout";

export function PrivacyPolicy() {
	return (
		<PolicyLayout title="Privacy Policy" lastUpdated="November 23, 2024">
			<h2>Introduction</h2>
			<p>
				This Privacy Policy explains how WalaGames ("we," "us," or "our")
				collects, uses, and protects information when you use our multiplayer
				drawing game website (the "Service"). We are committed to protecting
				your privacy and being transparent about our data practices.
			</p>

			<h2>Information Collection</h2>
			<h3>Information You Provide</h3>
			<p>Chat messages within game lobbies:</p>
			<ul>
				<li>
					These messages are temporarily stored only for the duration of the
					active game lobby
				</li>
				<li>Messages are automatically deleted when the lobby closes</li>
				<li>We do not maintain any permanent record of chat communications</li>
			</ul>

			<h3>Automatically Collected Information</h3>
			<p>We collect certain anonymous usage and performance data, including:</p>
			<ul>
				<li>Website performance metrics</li>
				<li>Basic analytics about site usage</li>
				<li>Technical information about how you interact with our Service</li>
			</ul>
			<p>
				All automatically collected information is anonymized and processed in
				compliance with GDPR requirements.
			</p>

			<h2>Data Storage</h2>
			<ul>
				<li>We do not maintain any user accounts</li>
				<li>We do not store any persistent player data</li>
				<li>We do not use databases to store personal information</li>
				<li>
					All lobby-related data is temporary and deleted upon lobby closure
				</li>
			</ul>

			<h2>Use of Information</h2>
			<p>We use the collected anonymous analytics data solely for:</p>
			<ul>
				<li>Improving website performance</li>
				<li>Understanding general usage patterns</li>
				<li>Maintaining and optimizing our Service</li>
				<li>Ensuring technical functionality</li>
			</ul>

			<h2>Data Protection</h2>
			<p>
				While we implement reasonable security measures, please note that no
				method of electronic transmission or storage is 100% secure. We strive
				to protect your information but cannot guarantee its absolute security.
			</p>

			<h2>Children's Privacy</h2>
			<p>
				Our Service is not intended for children under the age of 13. We do not
				knowingly collect or maintain information from persons under 13 years of
				age. If you are under 13, please do not use our Service.
			</p>

			<h2>Changes to This Privacy Policy</h2>
			<p>
				We may update this Privacy Policy from time to time. Any changes will be
				posted on this page with an updated revision date.
			</p>

			<h2>Contact Us</h2>
			<p>
				If you have any questions about this Privacy Policy, please contact us
				at [Your Contact Information].
			</p>
		</PolicyLayout>
	);
}
