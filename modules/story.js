import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
export class story {
    constructor(params={}) {
        var me = this;
        this.omk = params.omk;
        this.story = params.story;
        this.cont = params.cont;
        this.urlNoImage = params.urlNoImage ? params.urlNoImage : 'https://samszo.github.io/genStory24/assets/img/papi-GenStory24.png';
        var grid, items=[], nodes=[], graphCode;
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
            clearScene();
            let niv = 0, graph = me.cont.append('pre').attr('id','mermaidGraph').attr("class","mermaid");
            graphCode = `flowchart TD`;
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
                        } 
                    }
                })
            }else{
                graphCode += `
                    ${startNode} ${op['o:local_name']+d.value_resource_id}{No ${op['o:label']}
                    ${op['o:local_name']+d.value_resource_id} --> storyEnd
                    `;
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
                    //choose if event is success
                    if((d3.randomInt(100)())>50){
                        //choose one of the success event
                        graphCode += ` --> `;
                        event = me.getAleaEvent(event,'genstory:hasEventAfterValid');
                    }else{
                        //choose one of fail event
                        graphCode += ` --x `;
                        event = me.getAleaEvent(event,'genstory:hasEventAfterFailure');                
                    }
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
