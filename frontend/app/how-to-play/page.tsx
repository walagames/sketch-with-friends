"use client";

export default function HowToPlayPage() {
	return (
		<>
			<p>
				Sketch with Friends is a multiplayer drawing and guessing game where
				players take turns drawing words while others try to guess them!
			</p>

			<h2>Game Basics</h2>
			<p>
				In each round, one player becomes the artist and chooses from several
				word options. They have limited time to draw their chosen word while
				other players try to guess it. Letter hints are gradually revealed to
				help guessers, and points are awarded based on how quickly players guess
				correctly.
			</p>

			<h2>Scoring</h2>
			<ul>
				<li>Guessing players earn more points for faster correct guesses</li>
				<li>
					Drawing players earn points when others successfully guess their
					drawing
				</li>
			</ul>

			<h2>Creating a Room</h2>
			<p>
				Start your own game room and invite friends to join! As the room host,
				you can:
			</p>
			<ul>
				<li>Share the 4-letter room code with friends</li>
				<li>Customize game settings</li>
				<li>Start the game when everyone's ready</li>
			</ul>

			<h2>Game Settings</h2>
			<ul>
				<li>
					<strong>Game Modes:</strong>
					<ul>
						<li>Classic - Standard play with letter hints</li>
						<li>
							No Hints - Play without letter reveals for an extra challenge
						</li>
					</ul>
				</li>
				<li>
					<strong>Word Difficulty:</strong> Choose from Random, Easy, Medium, or
					Hard words
				</li>
				<li>
					<strong>Custom Words:</strong> Add your own words to the game
				</li>
				<li>
					<strong>Rounds:</strong> Select the number of rounds to play (each
					player draws once per round)
				</li>
				<li>
					<strong>Drawing Time:</strong> Set how long players have to complete
					their drawings
				</li>
				<li>
					<strong>Player Limit:</strong> Control how many players can join your
					room
				</li>
			</ul>

			<h2>Joining a Game</h2>
			<p>
				Have a room code? Simply enter the 4-letter code to join your friends'
				game and start playing!
			</p>
		</>
	);
}
