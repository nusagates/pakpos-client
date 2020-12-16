import Vue from 'vue'
require('bootstrap')
import BoostrapVue from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "font-awesome/css/font-awesome.min.css";
Vue.use(BoostrapVue)
import request from './Request'
new Vue({
    el: '#app',
    render(h) {
        return h(request)
    }
})