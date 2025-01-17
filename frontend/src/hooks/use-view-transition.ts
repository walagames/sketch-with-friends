import { useContext } from "react";

import { useEffect } from "react";
import { useState } from "react";

import { createContext } from "react";


import { EnterCodeView, EnterPlayerInfoView, PreGameView, PickingDrawerView, PickingGuesserView, DrawingView, PostDrawingView } from "@/components/views";
import { GameRole } from "@/state/features/game";
import { RootState } from "@/state/store";
import { useSelector } from "react-redux";
import { RoomState } from "@/state/features/room";


export enum Direction {
	UP,
	UP_FADE,
	DOWN,
	DOWN_FADE,
	LEFT,
	RIGHT,
    NONE,
}

const views: Record<RoomState, View> = {
  [RoomState.Waiting]: {
    Component: PreGameView,
    key: 'pre-game-host',
    transition: {
      direction: Direction.DOWN,
    },
  },
  [GameView.PickingDrawer]: {
    Component: PickingDrawerView,
    key: 'picking-drawer',
    transition: {
      direction: Direction.LEFT,
    },
  },
};

// Now determining transitions becomes much simpler
function getTransitionDirection(from: GameView, to: GameView): Direction {
  // Moving to a higher number means progressing forward
  if (to > from) {
    // Special case: Moving from post-drawing back to picking
    if (from === GameView.PostDrawing && to === GameView.PickingDrawer) {
      return Direction.UP; // Circle back to start of game round
    }
    return Direction.LEFT; // Normal game progression
  }
  
  // Moving to a lower number means going backwards
  if (to < from) {
    // Special case: Leaving a room (going back to join flow)
    if (from >= GameView.PreGameHost && to <= GameView.EnterUsername) {
      return Direction.DOWN;
    }
    return Direction.RIGHT; // Normal backward movement
  }
  
  return Direction.NONE; // Same view
}

// The view resolution becomes much simpler too
function resolveGameView(state: RootState): GameView {
  // If not in a room, handle join flow
  if (!state.room.id) {
    return state.client.enteredRoomCode 
      ? GameView.EnterUsername 
      : GameView.EnterCode;
  }

  switch (state.room.currentState) {
    case RoomState.Waiting:
      return GameView.PreGameHost;
  // In pre-game
  if (state.room.stage === RoomStage.PreGame) {
    return state.player.isHost 
      ? GameView.PreGameHost 
      : GameView.PreGamePlayer;
  }

  // During game
  if (state.room.stage === RoomStage.Playing) {
    switch (state.game.phase) {
      case GamePhase.Picking:
        return state.player.gameRole === GameRole.Drawing 
          ? GameView.PickingDrawer 
          : GameView.PickingGuesser;
      case GamePhase.Drawing:
        return GameView.Drawing;
      case GamePhase.PostDrawing:
        return GameView.PostDrawing;
    }
  }

  throw new Error('Invalid game state');
}

const UnanimousView = () => <></>;

export type View = {
	Component: React.ComponentType;
	key: string;
	transition: {
		direction: Direction;
	};
};

export const joinViews: Record<string, View> = {
	EnterCode: {
		Component: EnterCodeView,
		key: "join-enter-code",
		transition: {
			direction: Direction.RIGHT,
		},
	},
	ChoosePlayerInfo: {
		Component: EnterPlayerInfoView,
		key: "join-choose-player-info",
		transition: {
			direction: Direction.LEFT,
		},
	},
};

export const roomViews = {
	[RoomStage.PreGame]: {
		Component: PreGameView,
		key: "pre-game",
		transition: {
			direction: Direction.DOWN,
		},
	},
	[RoomStage.Playing]: {
		[GamePhase.Picking]: {
			[GameRole.Drawing]: {
				Component: PickingDrawerView,
				key: "playing-picking-drawer",
				transition: {
					direction: Direction.LEFT,
				},
			},
			[GameRole.Guessing]: {
				Component: PickingGuesserView,
				key: "playing-picking-guesser",
				transition: {
					direction: Direction.LEFT,
				},
			},
		},
		[GamePhase.Drawing]: {
			Component: DrawingView,
			key: "playing-drawing",
			transition: {
				direction: Direction.LEFT,
			},
		},
		[GamePhase.PostDrawing]: {
			Component: PostDrawingView,
			key: "playing-post-drawing",
			transition: {
				direction: Direction.LEFT,
			},
		},
		[GamePhase.Unanimous]: {
			Component: UnanimousView,
			key: "playing-unanimous",
			transition: {
				direction: Direction.LEFT,
			},
		},
	},
	[RoomStage.Unanimous]: {
		Component: UnanimousView,
		key: "unanimous",
		transition: {
			direction: Direction.LEFT,
		},
	},
} as const;


// Define possible positions for sprites in each view
type SpritePosition = {
  left: string;
  top: string;
  rotate: number;
  opacity: number;
};

// Map each game view to sprite positions
const spritePositions: Record<GameView, SpritePosition> = {
  [GameView.EnterCode]: {
    left: "40%",
    top: "45%",
    rotate: 35,
    opacity: 1
  },
  [GameView.EnterUsername]: {
    left: "66%",
    top: "45%",
    rotate: 20,
    opacity: 1
  },
  // ... positions for other views
};

// Create a context to share view transition information
type ViewTransitionContext = {
  from: GameView | null;
  to: GameView | null;
  direction: Direction;
};

const ViewTransitionContext = createContext<ViewTransitionContext>({
  from: null,
  to: null,
  direction: Direction.NONE
});

// A hook to manage view transitions and sprite animations
function useViewTransition(currentView: GameView) {
  const [transitionState, setTransitionState] = useState<ViewTransitionContext>({
    from: null,
    to: currentView,
    direction: Direction.NONE
  });

  // Update transition state when view changes
  useEffect(() => {
    setTransitionState(prev => ({
      from: prev.to,
      to: currentView,
      direction: getTransitionDirection(prev.to!, currentView)
    }));
  }, [currentView]);

  return transitionState;
}

// Main view container that provides transition context
function GameViewContainer() {
  const gameState = useSelector((state: RootState) => state);
  const currentView = resolveGameView(gameState);
  const transitionState = useViewTransition(currentView);

  return (
    <ViewTransitionContext.Provider value={transitionState}>
      <AnimatePresenceWithDirection
        direction={transitionState.direction}
        mode="sync"
      >
        <TransitionContainer key={currentView}>
          <views[currentView].Component />
          <SceneSprites />
        </TransitionContainer>
      </AnimatePresenceWithDirection>
    </ViewTransitionContext.Provider>
  );
}

// A component to manage sprites that are aware of view transitions
function SceneSprites() {
  const { from, to } = useContext(ViewTransitionContext);
  
  // Get sprite positions for current transition
  const fromPosition = from ? spritePositions[from] : null;
  const toPosition = to ? spritePositions[to] : null;

  return (
    <AnimatePresence mode="sync">
      <AirplaneDoodle
        layoutId="airplane"
        // If we're transitioning between known states, use those positions
        startAt={fromPosition ?? toPosition}
        animateTo={toPosition}
        // Calculate exit position based on next view's entry point
        leaveTo={toPosition}
        // Add a custom variant for handling late-join scenarios
        variants={{
          lateJoin: {
            // Special animation for when a player late-joins
            opacity: 0,
            transition: { duration: 0 }
          }
        }}
        // Use a custom prop to detect late-join scenarios
        animate={isLateJoin ? "lateJoin" : "animate"}
      />
    </AnimatePresence>
  );
}