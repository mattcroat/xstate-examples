import { assign, createMachine, interpret } from 'xstate'
import '../xstate/inspector'

type CounterContext = { count: number }

const counterMachine = createMachine(
	{
		schema: { context: {} as CounterContext },
		initial: 'active',
		context: { count: 0 },
		states: {
			active: {
				on: {
					INCREMENT: { actions: 'increment' },
					DECREMENT: { actions: 'decrement', cond: 'aboveZero' },
				},
			},
		},
	},
	{
		actions: {
			increment: assign({ count: (ctx) => ctx.count + 1 }),
			decrement: assign({ count: (ctx) => ctx.count - 1 }),
		},
		guards: {
			aboveZero: (ctx) => ctx.count > 0,
		},
	}
)

const counter = interpret(counterMachine, { devTools: true }).start()

function counterComponent() {
	const btn = 'bg-neutral-800 p-2 px-4 rounded-xl'

	const counterHtml = `
		<div class="flex gap-2">
			<button class="${btn}" data-increment>+</button>
			<span class="${btn}" data-count>0</span/>
			<button class="${btn}" data-decrement>-</button>
		</div>
	`

	document.body.insertAdjacentHTML('afterbegin', counterHtml)

	const incrementEl = document.querySelector<HTMLDivElement>('[data-increment]')
	const decrementEl = document.querySelector<HTMLDivElement>('[data-decrement]')
	const counterEl = document.querySelector<HTMLSpanElement>('[data-count]')

	incrementEl.onclick = () => counter.send({ type: 'INCREMENT' })
	decrementEl.onclick = () => counter.send({ type: 'DECREMENT' })

	counter.subscribe((state) => {
		counterEl.innerText = String(state.context.count)
	})
}

counterComponent()
