import { ContentLayout } from "@/layouts/content-layout";

export function PrivacyPolicy() {
	return (
		<ContentLayout title="Privacy Policy" lastUpdated="November 24, 2024">
			<p>
				This Privacy Policy explains how WalaGames ("we," "us," or "our")
				collects, uses, and protects information when you use Sketch with
				Friends (the "Service"). We are committed to protecting your privacy and
				being transparent about our data practices.
			</p>

			<h2>Agreement to Terms</h2>
			<p>
				By accessing or using Sketch with Friends, you agree to this Privacy Policy. 
				If you do not agree with any part of this policy, please do not use our Service. 
				Your continued use of the Service constitutes your acceptance of any updates 
				or changes we make to this policy.
			</p>

			<h2>Information Collection</h2>
			<h3>Information You Provide</h3>
			<p>Chat messages within game rooms:</p>
			<ul>
				<li>
					These messages are temporarily stored only for the duration of the
					active game room
				</li>
				<li>Messages are automatically deleted when the room closes</li>
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
					All room-related data is temporary and deleted upon room closure
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

			<h2>Cookies and Similar Technologies</h2>
			<p>
				We use essential cookies that are necessary for the basic functionality
				of our Service. These cookies do not collect personal information and
				are used only to:
			</p>
			<ul>
				<li>Maintain active game sessions</li>
				<li>Remember temporary room preferences</li>
				<li>Ensure proper game functionality</li>
			</ul>

			<h2>Third-Party Services</h2>
			<p>Our Service uses the following third-party services:</p>
			<ul>
				<li>
					Oracle Cloud Infrastructure
				</li>
			</ul>
			<p>
				These services may collect anonymous technical information as described
				in their respective privacy policies.
			</p>

			<h2>Your Rights</h2>
			<p>
				Under GDPR and other applicable privacy laws, you have certain rights
				regarding your data:
			</p>
			<ul>
				<li>Right to access any data we hold about you</li>
				<li>Right to request deletion of any temporary data</li>
				<li>Right to object to our data processing</li>
				<li>Right to withdraw consent for analytics collection</li>
			</ul>
			<p>
				Since we don't maintain user accounts or store persistent personal data,
				most of these rights apply only to temporary session data and analytics
				preferences.
			</p>

			<h2>International Data Transfers</h2>
			<p>
				Our Service is hosted and operated in the United States. If you are
				accessing our Service from outside the United States, please be aware
				that your information may be transferred to, stored, and processed in
				the United States where our servers are located.
			</p>

			<h2>Contact Us</h2>
			<p>
				If you have any questions about this Privacy Policy, please contact us
				at contact@walagames.com.
			</p>
		</ContentLayout>
	);
}
