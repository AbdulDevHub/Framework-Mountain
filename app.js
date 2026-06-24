// Utility functions
function greet(name) {
  return `Hi, ${name}!`;
}

function farewell(name) {
  return `Goodbye, ${name}!`;
}

function thanks(name) {
  return `Thanks, ${name}!`;
}

function logger(msg) {
  console.log("[LOG]:", msg);
}

function multiply(a, b) {
  return a * b;
}

console.log(greet("World"));
console.log(farewell("World"));
console.log(logger("App started"));