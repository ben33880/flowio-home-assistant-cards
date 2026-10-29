import{test,expect}from'@playwright/test';
test('construction de la fixture native sans attribut ajouté dans le constructeur ni erreur JavaScript',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/demo/');
 const status=page.locator('flowio-header-status');
 await expect(status.locator('hui-heading-card h2')).toHaveText('Piscine · Jardin');
 await expect(status.locator('[role=alert]')).toHaveCount(0);
 const result=await page.evaluate(()=>{
  const Constructor=customElements.get('hui-heading-card')!;
  const card=document.createElement('hui-heading-card')as HTMLElement&{setConfig:(config:unknown)=>void};
  const result={registeredInstance:card instanceof Constructor,attributesBeforeConnection:card.attributes.length,hasSetConfig:typeof card.setConfig==='function'};
  card.setConfig({type:'heading',heading:'Construction vérifiée',badges:[]});
  document.body.append(card);
  const title=card.shadowRoot?.querySelector('h2')?.textContent,marker=card.getAttribute('data-demo-native');
  card.remove();return{...result,title,marker};
 });
 expect(result).toEqual({registeredInstance:true,attributesBeforeConnection:0,hasSetConfig:true,title:'Construction vérifiée',marker:'true'});
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);
});
