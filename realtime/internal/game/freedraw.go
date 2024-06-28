// free drawing game mode
package game

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	realtime "github.com/jacobschwantes/sketch-with-friends/realtime/internal"
)

type freedraw struct {
	event          chan *realtime.Event
	scores         map[realtime.Player]int
	answers        map[realtime.Player]playerAnswer
	currentRound   int
	totalRounds    int
	roundDuration  int
	roundStartedAt time.Time
}

type playerAnswer struct {
	answerID  string
	timeTaken float32
}

func FreeDraw() realtime.Game {
	return &freedraw{
		event:         make(chan *realtime.Event, 5), // event buffer size of 5
		roundDuration: 15,
	}
}

func (fd *freedraw) Run(ctx context.Context, l realtime.Room) {
	fmt.Println("Game routine started: ", l.Code())
	roundTimer := time.NewTimer(time.Duration(fd.roundDuration+7) * time.Second)
	judgeTimer := time.NewTimer(time.Duration(fd.roundDuration+2) * time.Second)

	fd.start(l)

	defer func() {
		fmt.Println("Game routine exited: ", l.Code())
		roundTimer.Stop()
		judgeTimer.Stop()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case e := <-fd.event:
			fmt.Printf("recv event in game routine of type %s from player %s\n", e.Type, e.Player.ID())
			l.Broadcast(msg("we got your event!"))
			fd.handleEvent(e)
		case <-judgeTimer.C:
			fmt.Println("judge timer")
			fd.judgeAnswers()
			l.Broadcast(fd.scoresMsg())
			fd.currentRound++
		case <-roundTimer.C:
			fmt.Println("round timer")

			if fd.currentRound == fd.totalRounds {
				fd.end(l)
				return
			}

			roundMsg := fd.questionMsg()
			l.Broadcast(roundMsg)
			fd.roundStartedAt = time.Now()
			roundTimer.Reset(time.Duration(fd.roundDuration+7) * time.Second)
			judgeTimer.Reset(time.Duration(fd.roundDuration+2) * time.Second)
		}
	}

}

func (fd *freedraw) start(l realtime.Room) {
	fmt.Println("Game started")
	fd.roundStartedAt = time.Now()
	fd.scores = make(map[realtime.Player]int)
	fd.answers = make(map[realtime.Player]playerAnswer)
	fd.currentRound = 0
	type startMsg struct {
		RoundDuration int               `json:"roundDuration"`
		CurrentRound  int               `json:"currentRound"`
		TotalRounds   int               `json:"totalRounds"`
	}
	roundOneMsg := startMsg{
		RoundDuration: fd.roundDuration,
		CurrentRound:  0,
		TotalRounds:   fd.totalRounds,
	}
	roundOneBytes, _ := json.Marshal(&realtime.Event{
		Type:    realtime.GAME_START,
		Payload: roundOneMsg,
	})
	l.Broadcast(roundOneBytes)
}

func (fd *freedraw) end(l realtime.Room) {
	fmt.Println("Game ended")
	endBytes, _ := json.Marshal(&realtime.Event{
		Type: realtime.GAME_OVER,
	})

	l.Broadcast(endBytes)
}

func (fd *freedraw) questionMsg() []byte {
	type newRoundMsg struct {
	}

	questionBytes, _ := json.Marshal(&realtime.Event{
		Type:    realtime.NEW_ROUND,
		Payload: &newRoundMsg{},
	})
	return questionBytes
}

func (fd *freedraw) scoresMsg() []byte {
	var correctAnswerID string


	type scores struct {
		Scores        map[string]int `json:"scores"`
		CorrectAnswer string         `json:"correctAnswer"`
	}

	scoreMsg := &scores{
		Scores:        make(map[string]int),
		CorrectAnswer: correctAnswerID,
	}

	for p, s := range fd.scores {
		scoreMsg.Scores[p.ID()] = s
	}

	scoresBytes, _ := json.Marshal(&realtime.Event{
		Type:    realtime.UPDATE_SCORES,
		Payload: scoreMsg,
	})
	return scoresBytes
}

func (fd *freedraw) judgeAnswers() {
	
}

func (fd *freedraw) calculateScore(a playerAnswer) int {
	timeTaken := (float32(fd.roundDuration) - a.timeTaken) / float32(fd.roundDuration)

	if timeTaken < 0.0 {
		timeTaken = 0
	}

	return int(timeTaken * 100.0)
}

func (fd *freedraw) handleEvent(e *realtime.Event) {
	switch e.Type {
	case realtime.STROKE:
		answer := playerAnswer{
			answerID:  e.Payload.(string),
			timeTaken: float32(time.Since(fd.roundStartedAt).Milliseconds() / 1000),
		}
		fd.answers[e.Player] = answer
	}
}

func (fd *freedraw) PushEvent(e *realtime.Event) {
	select {
	case fd.event <- e:
		fmt.Println("sent event to chan in game")
	default:
		fmt.Println("dropped event in game chan")
	}

}

func msg(m string) []byte {
	msgBytes, _ := json.Marshal(&realtime.Event{
		Type:    realtime.MESSAGE,
		Payload: m,
	})
	return msgBytes
}
