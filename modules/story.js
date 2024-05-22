import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
export class story {
    constructor(params={}) {
        var me = this;
        this.omk = params.omk;
        this.story = params.story;
        this.cont = params.cont;
        this.urlNoImage = params.urlNoImage ? params.urlNoImage : 'https://samszo.github.io/genStory24/assets/img/papi-GenStory24.png';
        var grid, items=[], nodes=[], graphCode,
        eventValid=[], eventFail=[],isValid=[],linkValid=[],linkFail=[],links;

        this.init = function () {
            //me.createChainEvents();
            mermaid.initialize({ startOnLoad: false,theme: 'dark', });
            me.createDiagram();
        }

        function clearScene(){
            me.cont.selectAll('pre').remove();
            me.cont.selectAll('div').remove();
        }

        this.createDiagram = async function(){
            items=[];
            eventValid=[], eventFail=[],isValid=[],linkValid=[0],linkFail=[],links=0;
            clearScene();
            let niv = 0, graph = me.cont.append('pre').attr('id','mermaidGraph').attr("class","mermaid");
            graphCode = `
            %%{
                init: {
                  'theme': 'black',
                  'themeVariables': {
                    'edgeLabelBackground':'white'
                  }
                }
            }%%
            flowchart TD`;
            //create initial condition
            if(me.story['genstory:hasInitialCondition']){
                graphCode += `
                    storyStart[Start of the story]-->initcond{Initial condition};
                    storyEnd[End of the story]`;
                //create flow for each initial condition
                createEventSubgraph(me.story,'genstory:hasInitialCondition','initcond -->',niv);
            }else{
                graphCode += `
                    storyStart[Start] -->initcond{No initial condition}
                    initcond --> storyEnd[End of the story]
                    `;
            }

            graphCode += `
            classDef StartEnd fill:green,stroke:white,stroke-width:8px
            classDef eventValid fill:green,stroke:green,stroke-width:4px
            classDef eventFail fill:red,stroke:red,stroke-width:4px,color:white
            classDef isValid fill:orange,stroke:orange,stroke-width:8px,color:black
            
            class storyStart,storyEnd,initcond StartEnd;
            `;
            if(eventValid.length)graphCode+= `class ${eventValid.join(',')} eventValid;
            `;
            if(eventFail.length)graphCode+= `class ${eventFail.join(',')} eventFail;
            `;
            if(isValid.length)graphCode+= `class ${isValid.join(',')} isValid;
            `;
            if(linkValid.length)graphCode+= `linkStyle ${linkValid.join(',')} stroke:green,color:green,stroke-width:4px,color:green
            `;
            if(linkFail.length)graphCode+= `linkStyle ${linkFail.join(',')} stroke:red,color:red
            `;

            //render graphCode
            console.log(graphCode);        
            graph.html(graphCode);
            await mermaid.run({
                querySelector: '#mermaidGraph',
              });
        }

        //create event subgraph
        function createEventSubgraph(d,p,startNode,niv){
            let op = me.omk.getPropByTerm(p);            
            if(d[p]){
                d[p].forEach((vr,j)=>{
                    //check if node exist
                    if(items[vr.value_resource_id]){
                        graphCode += `
                        ${startNode} |${op['o:label']}|item${vr.value_resource_id}                                        
                        `;
                        links++;
                        if(startNode.startsWith('initcond'))linkValid.push(links);
                        if(startNode.startsWith('chooseValid'))linkValid.push(links);
                        if(startNode.startsWith('chooseFail'))linkFail.push(links);
                    }else if(vr.type=="resource"){
                        //get properties of resource
                        let r = getItem(vr.value_resource_id);
                        graphCode += `
                        subgraph sgItem${r['o:id']}[-]`;

                        //check if item has valid or fail event
                        if(r['genstory:hasEventAfterValid'] || r['genstory:hasEventAfterFailure']){
                            graphCode += `
                            item${r['o:id']}[${r['o:title']}]-->isValid${r['o:id']}{is valid ?}
                            isValid${r['o:id']}-->|yes|chooseValid${r['o:id']}{Choose valid}
                            isValid${r['o:id']}-->|no|chooseFail${r['o:id']}{Choose fail}
                            end
                            ${startNode} |${op['o:label']}|item${r['o:id']}                                        
                            `;
                            isValid.push(`isValid${r['o:id']}`);
                            eventFail.push(`chooseFail${r['o:id']}`);
                            eventValid.push(`chooseValid${r['o:id']}`);
                            links++;
                            linkValid.push(links);
                            links++;
                            linkValid.push(links);
                            links++;
                            linkFail.push(links);
                            links++;
                            linkValid.push(links);
                            //create fail event
                            createEventSubgraph(r,'genstory:hasEventAfterFailure','chooseFail'+r['o:id']+'-->',niv+1);
                            //create valid event
                            createEventSubgraph(r,'genstory:hasEventAfterValid','chooseValid'+r['o:id']+'-->',niv+1);
                        }else{
                            graphCode += `
                            item${r['o:id']}[${r['o:title']}]
                            end
                            ${startNode} |${op['o:label']}|item${r['o:id']}                                        
                            item${r['o:id']} --> |No valid or fail event|storyEnd                                        
                            `;
                            links++;
                            if(startNode.startsWith('initcond'))linkValid.push(links);
                            if(startNode.startsWith('chooseValid'))linkValid.push(links);
                            if(startNode.startsWith('chooseFail'))linkFail.push(links);
                            links++;
                            linkFail.push(links);
                        } 
                    }
                })
            }else{
                //go to end event
                graphCode += `
                    ${startNode} storyEnd
                    `;
                links++;
                linkValid.push(links);
    }
        }
        //

        this.addEvent=function(e,num){
            let ec = {'node':'item'+e['o:id']+'_'+num};
            ec.code=`${ec.node}("
            <span>${e['o:title']}</span>            
            <img src='${e.thumbnail_display_urls.medium?e.thumbnail_display_urls.medium:me.urlNoImage}' style='width:10px;min-height:0'/>
            ")`;
            ec.class=`
            class ${ec.node} image`;
            return ec;
        }

        this.createChainEvents = async function(){
            me.omk.loader.show();
            clearScene();
            let classDef="classDef image fill:none,stroke:none", classes="", 
                graph = me.cont
                    //.append('div').style('overflow-x','scroll').style('with','100%')
                    .append('pre').attr('id','mermaidGraph').attr("class","mermaid");
            graphCode = `flowchart LR
                story${me.story['o:id']}(${me.story['o:title']}) -..-> `;
            //create initial condition
            if(me.story['genstory:hasInitialCondition']){

                //get initial event
                let num = 0, event = me.getAleaEvent(me.story,'genstory:hasInitialCondition');
                //create a chain of causes and effects
                while (event['o:title'] && num<100) {
                    let ec = me.addEvent(event,num);
                    graphCode += ` ${ec.code} `;
                    classes = `
                    ${ec.class}`;
                    //choose next event
                    event = getNextEvent(event,['genstory:hasEventAfterValid','genstory:hasEventAfterFailure']);
                    num ++;
                }
                graphCode += ` storyEnd(The End) `;
                graphCode += ` 
                    ${classDef+classes}` ;
            }else{
                graphCode += `
                    initcond{No initial condition} --> storyEnd[The End]
                    `;
            }

            //render graphCode
            console.log(graphCode);        
            graph.html(graphCode);
            await mermaid.run({
                querySelector: '#mermaidGraph',
              });
            //change generate graph
            let vb = graph.select('svg').attr('viewBox').split(' ');
            graph.select('svg').attr('viewBox','').attr('style',`width:${vb[2]}px;height:${vb[3]}px;`)            
            me.omk.loader.hide(true);
        }

        function getNextEvent(e, arrP){
            let choice, event, choiceP, min=0, max=0;
            arrP.forEach(p=>{
                min = getMinMaxAnnoValue(e,p,"schema:minValue",min,'min');
                max = getMinMaxAnnoValue(e,p,"schema:maxValue",max,'max');
            })
            if(max!=0){            
                choice = d3.randomInt(min, max)();
                console.log('getNextEvent:choice'+choice+' between '+min+', '+max);            
                arrP.forEach(p=>{
                    e[p].forEach(ve=>{
                        if(!event && ve.min <= choice && ve.max >= choice){
                            choiceP = p;
                            event = me.omk.getItem(ve.value_resource_id);
                        }
                    })
                })
            }
            if(!event){
                choiceP = arrP[Math.floor(Math.random()*arrP.length)];
                event = me.getAleaEvent(e,choiceP);
            }
            switch (choiceP) {
                case 'genstory:hasEventAfterValid':
                    graphCode += ` --> `;                    
                    break;            
                case 'genstory:hasEventAfterFailure':
                    graphCode += ` --x `;                    
                    break;            
                default:
                    graphCode += ` --> `;
                    break;
            }
            console.log('getNextEvent:choiceP'+choiceP);            
            return event;
        }

        function getMinMaxAnnoValue(e, p, a, mm, mLabel){
            if(e[p]){
                e[p].forEach(ve=>{
                    if(ve["@annotation"] && ve["@annotation"][a]){
                        ve[mLabel] = parseInt(ve["@annotation"][a][0]["@value"]);
                        if(mLabel=='min')mm = ve[mLabel] < mm ? ve[mLabel] : mm; 
                        if(mLabel=='max')mm = ve[mLabel] > mm ? ve[mLabel] : mm; 
                    }
                });    
            }
            return mm;
        }

        this.getAleaEvent = function(e,p){
            if(!e[p])return {'o:title':false,'o:description':"No : "+p+"\nPlease add value(s) to : "+p+"\nin : "+me.omk.getItemAdminLink(e)};
            let choice = e[p][Math.floor(Math.random()*e[p].length)];
            if(choice.value_resource_id)return me.omk.getItem(choice.value_resource_id);
            else return {'o:title':choice,'o:description':""};        
        }

        function getItem(id){
            if(!items[id]){
                items[id]=me.omk.getItem(id);
            }
            return items[id];
        }
        this.init();
    }
}
