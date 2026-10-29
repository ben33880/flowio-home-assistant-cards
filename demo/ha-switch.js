import './ha-native-heading.js';
import './ha-native-controls.js';
// Demo/test stand-in only. Production uses Home Assistant's registered ha-switch.
if(!customElements.get('ha-switch'))customElements.define('ha-switch',class extends HTMLElement{
static get observedAttributes(){return['aria-label'];}
constructor(){super();this._checked=false;this._disabled=false;this._label='';this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:inline-flex;align-items:center;min-height:40px}input{width:40px;height:24px;margin:0;accent-color:var(--primary-color)}</style><input type=checkbox role=switch>';this.input=this.shadowRoot.querySelector('input');this.input.addEventListener('change',e=>{e.stopPropagation();this._checked=this.input.checked;this.dispatchEvent(new Event('change',{bubbles:true,composed:true}));});}
connectedCallback(){this.sync();}attributeChangedCallback(){this.sync();}
get checked(){return this._checked;}set checked(value){this._checked=!!value;this.sync();}
get disabled(){return this._disabled;}set disabled(value){this._disabled=!!value;this.sync();}
get accessibleLabel(){return this._label;}set accessibleLabel(value){this._label=value;this.sync();}
sync(){if(!this.input)return;this.input.checked=this._checked;this.input.disabled=this._disabled;this.input.setAttribute('aria-label',this._label||this.getAttribute('aria-label')||'');}
});
