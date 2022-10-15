import { assign, createMachine, interpret } from 'xstate'
import '../xstate/inspector'

type TemperatureContext = {
	C?: number | string
	F?: number | string
}

type TemperatureEvent =
	| {
			type: 'CELSIUS'
			value: string
	  }
	| {
			type: 'FAHRENHEIT'
			value: string
	  }

const temperatureMachine = createMachine<TemperatureContext, TemperatureEvent>(
	{
		initial: 'active',
		context: { C: null, F: null },
		states: {
			active: {
				on: {
					CELSIUS: { actions: 'celsius' },
					FAHRENHEIT: { actions: 'fahrenheit' },
				},
			},
		},
	},
	{
		actions: {
			celsius: assign({
				C: (_, event) => event.value,
				F: (_, event) =>
					event.value.length ? +event.value * (9 / 5) + 32 : '',
			}),
			fahrenheit: assign({
				C: (_, event) =>
					event.value.length ? ((+event.value - 32) * 5) / 9 : '',
				F: (_, event) => event.value,
			}),
		},
	}
)

const temperatureConverter = interpret(temperatureMachine, {
	devTools: true,
}).start()

const html = `
    <label>
      <input
        class="celsius text-black"
        placeholder="0"
        type="number"
      />
      ˚C
    </label>
    <div>=</div>
    <label>
      <input
        class="fahrenheit text-black"
        placeholder="0"
        type="number"
      />
      ˚F
    </label>
  `

document.body.insertAdjacentHTML('afterbegin', html)

const celsiusEl = document.querySelector<HTMLInputElement>('.celsius')!
const fahrenheitEl = document.querySelector<HTMLInputElement>('.fahrenheit')!

temperatureConverter.subscribe((state) => {
	celsiusEl.value = String(state.context.C)
	fahrenheitEl.value = String(state.context.F)
})

celsiusEl.oninput = (event) => {
	const value = (event.target as HTMLInputElement).value
	temperatureConverter.send('CELSIUS', { value })
}

fahrenheitEl.oninput = (event) => {
	const value = (event.target as HTMLInputElement).value
	temperatureConverter.send('FAHRENHEIT', { value })
}
