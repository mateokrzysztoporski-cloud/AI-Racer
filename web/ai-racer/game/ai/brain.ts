// Brain: a small neural network. Sensor numbers go in, gas and steer come out.

// Types

export type Brain = {
  layers: number[]; // neurons per layer
  weights: number[]; // all weights and biases in one list
};

// Brain

// new brain with random weights between -1 and 1
export function createBrain(layers: number[]): Brain {
  const weights = Array.from({ length: countWeights(layers) }, () => Math.random() * 2 - 1);
  return { layers: [...layers], weights };
}

// runs the inputs through the network, every output is between -1 and 1
export function think(brain: Brain, inputs: number[]): number[] {
  let values = inputs;
  let w = 0; // where we are in the weights list

  for (let layer = 1; layer < brain.layers.length; layer++) {
    const next: number[] = [];
    for (let neuron = 0; neuron < brain.layers[layer]; neuron++) {
      let sum = brain.weights[w++]; // bias: the neuron's own starting value
      for (const value of values) {
        sum += value * brain.weights[w++];
      }
      next.push(Math.tanh(sum)); // squeezes any number into -1 or 1
    }
    values = next;
  }

  return values;
}

// how many numbers a network with these layers needs
export function countWeights(layers: number[]): number {
  let count = 0;
  for (let layer = 1; layer < layers.length; layer++) {
    count += layers[layer] * (layers[layer - 1] + 1); // + 1 = the bias
  }
  return count;
}

// Breeding

export function copyBrain(brain: Brain): Brain {
  return { layers: [...brain.layers], weights: [...brain.weights] };
}

// child gets every weight from one of the two parents, 50/50
export function crossover(mother: Brain, father: Brain): Brain {
  const weights = mother.weights.map((weight, i) =>
    Math.random() < 0.5 ? weight : father.weights[i],
  );
  return { layers: [...mother.layers], weights };
}

// changes some weights a little
// rate = chance for each weight to change, amount = how big the change can be
export function mutate(brain: Brain, rate: number, amount: number): Brain {
  const weights = brain.weights.map((weight) =>
    Math.random() < rate ? weight + (Math.random() * 2 - 1) * amount : weight,
  );
  return { layers: [...brain.layers], weights };
}
