import { useEffect, useReducer } from 'react';
import Header from './components/Header';
import Main from './screens/Main';
import Loading from './components/Loader';
import Error from './components/Error';
import FinishedScreen from './screens/FinishedScreen';
import StartScreen from './screens/StartScreen';
import Timer from './components/Timer';
import Question from './components/Question';
import NextButton from './components/NextButton';
import Progress from './components/Progress';
const SECONDS_PER_SECONDS = 30;
const initialState = {
  questions: [],
  status: 'loading',
  index: 0,
  answer: null,
  points: 0,
  highScore: 0,
  secondsLeft: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'dataReceived':
      return { ...state, questions: action.payload, status: 'ready' };
    case 'dataFailed':
      return { ...state, questions: [], status: 'error' };
    case 'start':
      return {
        ...state,
        status: 'active',
        secondsLeft: state.questions.length * SECONDS_PER_SECONDS,
      };

    case 'nextQuestion':
      return { ...state, index: state.index + 1, answer: null };
    case 'newAnswer':
      const question = state.questions.at(state.index);
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };
    case 'finished':
      return {
        ...state,
        status: 'finished',
        highScore:
          state.points > state.highScore ? state.points : state.highScore,
      };
    case 'restart':
      return {
        ...state,
        status: 'ready',
        index: 0,
        answer: null,
        points: 0,
        secondsLeft: 10,
      };
    case 'tick':
      return {
        ...state,
        secondsLeft: state.secondsLeft - 1,
        status: state.secondsLeft === 0 ? 'finished' : state.status,
      };
    default:
      throw new Error('Unknown action');
  }
};

const App = () => {
  const [
    { questions, status, index, answer, points, highScore, secondsLeft },
    dispatch,
  ] = useReducer(reducer, initialState);

  const numQuestions = questions.length;
  const totalPoints = questions.reduce((acc, cur) => acc + cur.points, 0);

  useEffect(function () {
    fetch('http://localhost:8000/questions')
      .then((res) => res.json())
      .then((data) => dispatch({ type: 'dataReceived', payload: data }))
      .catch(() => dispatch({ type: 'dataFailed' }));
  }, []);

  return (
    <div className='app'>
      <Header />
      <Main>
        {status === 'loading' && <Loading />}
        {status === 'error' && <Error />}
        {status === 'ready' && (
          <StartScreen numQuestions={numQuestions} dispatch={dispatch} />
        )}
        {status === 'active' && (
          <>
            <Progress
              points={points}
              numQuestions={numQuestions}
              index={index}
              totalPoints={totalPoints}
              answer={answer}
            />
            <Question
              dispatch={dispatch}
              answer={answer}
              question={questions[index]}
            />
            <Timer dispatch={dispatch} secondsLeft={secondsLeft} />
            <NextButton
              dispatch={dispatch}
              answer={answer}
              numQuestions={numQuestions}
              index={index}
            />
          </>
        )}
        {status === 'finished' && (
          <FinishedScreen
            totalPoints={totalPoints}
            points={points}
            highScore={highScore}
            dispatch={dispatch}
          />
        )}
      </Main>
    </div>
  );
};

export default App;
