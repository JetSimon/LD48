Vue.component('player-box', {
    props: ['name', 'color'],
    template: `
    <div class="rounded-lg shadow-lg bg-white shadow w-3/4 h-40 text-center">
        <button id="voteButton" class="hover:bg-gray-400 -my-3 rounded-full px-3 py-1 bg-gray-300">Vote</button>
        <h1 :class="['font-bold text-xl',color]">{{name}} - <span id="score">0</span></h1>
        <p class="mx-3 h-full break-words mt-3 font-serif" id="poem"></p>     
    </div>
    `
})

var app = new Vue({el: '#app', data: {}})