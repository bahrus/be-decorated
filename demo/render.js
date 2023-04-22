let count = 0;
export function render(host){
    host.innerHTML = String.raw `
    <div>I am here</div>
    `;
    count++;
    console.log({count});
}