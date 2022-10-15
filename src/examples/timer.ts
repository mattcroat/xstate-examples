import { assign, createMachine, interpret } from 'xstate'
import '../xstate/inspector'

type TimerContext = {
	elapsed: number
	duration: number
	interval: number
}

type TimerEvent =
	| {
			type: 'TICK'
	  }
	| {
			type: 'DURATION.UPDATE'
			value: number
	  }
	| {
			type: 'RESET'
	  }

const timerMachine = createMachine<TimerContext, TimerEvent>({
	initial: 'running',
	context: {
		elapsed: 0,
		duration: 5,
		interval: 0.1,
	},
	states: {
		running: {
			invoke: {
				src: (ctx) => (cb) => {
					const interval = setInterval(() => cb('TICK'), 1000 * ctx.interval)
					return () => clearInterval(interval)
				},
			},
			on: {
				'': {
					target: 'paused',
					cond: (ctx) => ctx.elapsed >= ctx.duration,
				},
				TICK: {
					actions: assign({
						elapsed: (ctx) => +(ctx.elapsed + ctx.interval).toFixed(2),
					}),
				},
			},
		},
		paused: {
			on: {
				'': {
					target: 'running',
					cond: (ctx) => ctx.elapsed < ctx.duration,
				},
			},
		},
	},
	on: {
		'DURATION.UPDATE': {
			actions: assign({ duration: (_, event) => event.value }),
		},
		RESET: {
			actions: assign<TimerContext>({ elapsed: 0 }),
		},
	},
})

const timer = interpret(timerMachine, { devTools: true }).start()

const html = `
  <section class="flex flex-col gap-2">
    <label class="flex flex-col">
      <span>Elapsed time:</span>
      <output class="output" />
      <progress class="progress" />
    </label>

    <label class="flex flex-col">
      <span>Duration:</span>
      <input class="duration" min=0 max=30 type="range" />
    </label>

    <button class="reset p-2 bg-neutral-800 rounded">Reset</button>
  </section>
`

document.body.insertAdjacentHTML('afterbegin', html)

const outputEl = document.querySelector<HTMLOutputElement>('.output')!
const progressEl = document.querySelector<HTMLProgressElement>('.progress')!
const durationEl = document.querySelector<HTMLInputElement>('.duration')!
const resetEl = document.querySelector<HTMLButtonElement>('.reset')!

timer.subscribe((state) => {
	const { elapsed, duration } = state.context

	outputEl.innerText = `${elapsed.toFixed(1)}s / ${duration.toFixed(1)}s`
	progressEl.max = duration
	progressEl.value = elapsed
	durationEl.valueAsNumber = duration
})

durationEl.oninput = (event) => {
	const value = (event.target as HTMLInputElement).valueAsNumber
	timer.send({ type: 'DURATION.UPDATE', value })
}

resetEl.onclick = () => timer.send({ type: 'RESET' })
