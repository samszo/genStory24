export class modal {
    constructor(params={}) {
        var me = this;
        this.titre = params.titre ? params.titre : "Message";
        this.body = params.body ? params.body : "";
        this.boutons = params.boutons ? params.boutons : [{'name':"Close"}];
        var m, mBody, mFooter;
        this.init = function () {
            //ajoute la modal pour les messages
            let html = `
                <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                    <h5 class="modal-title">${me.titre}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                    ${me.body}                    
                    </div>                          
                    <div class="modal-footer">
                    </div>
                </div>
                </div>
            `;
            d3.select('#modalGenerateur').remove();
            let sm = d3.select('body').append('div')
                .attr('id','modalGenerateur').attr('class','modal').attr('tabindex',-1);
            sm.html(html);
            m = new bootstrap.Modal('#modalGenerateur');
            mBody = sm.select('.modal-body');
            mFooter = sm.select('.modal-footer');
            me.setBoutons();
        }
        this.setBoutons = function(boutons=false){
            if(boutons)me.boutons=boutons;
            mFooter.selectAll('button').remove();
            me.boutons.forEach(b=>{
                switch (b.name) {
                    case 'Close':
                        mFooter.append('button').attr('type',"button").attr('class',"btn btn-secondary")
                            .attr('data-bs-dismiss',"modal").html(b.name);
                        break;                
                    default:
                        mFooter.append('button').attr('type',"button").attr('class',"btn "+b.class)
                            .on('click',b.fct).html(b.name);
                        break;
                }
            })
        }
        this.add = function(p){
            let s=d3.select('#'+p);
            //ajoute la modal si inexistant
            if(s.empty()){
                s = d3.select('body').append('div')
                    .attr('id',p).attr('class','modal').attr('tabindex',-1);
                s.html(eval(p));
            }
            return {'m':new bootstrap.Modal('#'+p),'s':s};
        }
        this.setBody = function(html){
            mBody.html(html);
        }
        this.show = function(){
            m.show();
        }
        this.hide = function(){
            m.hide();
        }

        this.init();
    }
}

//ajoute la modal pour le paramétrage du prompt
export let modalPromptParams = `
    <div class="modal-dialog">
    <div class="modal-content bg-secondary text-white">
        <div class="modal-header">
        <h5 class="modal-title">Prompt params</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <h6>Choose a prompt template<h6>                    
            <div id="promptTemplate"></div>            
        </div>                          
        <div class="modal-footer">
            <button id='btnAddNewStoryboard' type="button" class="btn btn-danger">Add new storyboard</button>
        </div>
    </div>
    </div>
`;