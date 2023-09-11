var config = {};
const pollingTime = 30000;//milliseconds
var token;

$(document).ready(function(){
	$("#errorMessage").hide();
    
    if(window.location.hash) 
    {	
        config.environment = getParameterByName('environment', window.location.search);               
        token = getParameterByName('access_token', window.location.hash);
        location.hash = '';
        
        
    }
    else
    {	
        //Config Genesys Cloud
        config = {
            "environment": "usw2.pure.cloud",
            "clientId": "65bddbb5-72f8-45f3-b507-dc68cbf5a938",
            "redirectUri": "https://uriosteamarillo.github.io/DNC/index.html"

        };
        
        var queryStringData = {
            response_type: "token",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        }        
        
        console.log(config.environment)
        window.location.replace("https://login." + config.environment + "/authorize?" + jQuery.param(queryStringData));
    }

});


function getParameterByName(name, data) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&?]" + name + "=([^&#?]*)"),
      results = regex.exec(data);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

function getActiveConversations(token){
    

    //console.log(query, "QUERY");
    let url = "https://api." + config.environment + "/api/v2/" + "conversations";
    let conversations = [];

    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "GET",
            beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
            contentType: "application/json",
            dataType: 'json',	
            success: function (result) {  
                
                console.log(result)
                //console.log(result.conversations, "getWaitingConversations - page: " + pageNumber);
                if (result && result.conversations) {                  
                    $.each(result.conversations, function (index, conversation) {
                        const acdParticipant = conversation.participants.find(p => p.purpose == "acd");                    
                        if(acdParticipant){                        
                            const session = acdParticipant.sessions.find(s => s.mediaType == "voice");
                            if(session){
                                if(session.segments && session.segments.length > 0){
                                    
                                    const segment = session.segments[0];
                                    conversation.queueId = segment.queueId;                                    
                                    const queue = queues.find(function (r) { return r.id === conversation.queueId });

                                    if(queue){
                                        conversation.queueName = queue.name;                                       
                                    }                                    

                                }                                                           
                            }
                        }
                        const ivrParticipant = conversation.participants.find(p => p.purpose == "ivr");                    
                        if(ivrParticipant){ 
                            const session = ivrParticipant.sessions.find(s => s.mediaType == "voice");
                            if(session){                               
                                if(session.flow && session.flow.outcomes) {
                                    conversation.flowOutcomes = []; 
                                    $.each(session.flow.outcomes, function (index, flowOutcome) {
                                        const outcome = outcomes.find(function (o) { return o.id === flowOutcome.flowOutcomeId });                                        
                                        if(outcome){
                                            
                                            conversation.flowOutcomes.push(outcome.name);                                                   
                                        }
                                        
                                    });

                                }                              
                            }

                        } 
                        
                        conversations.push(conversation);                            
                    });
                    
                }
                resolve(conversations);                
            },
            error: function (request) {
                console.log("getWaitingConversations-error", request);                
                reject("get-waiting-conversations -> " + JSON.stringify(request));

            }
        }); 
    });

}



function addNumberToDNC( phoneNumberToAdd) {
    let dnclist = '1ea5c5a9-76f2-451f-9798-7ba8b5be179c';
    console.log(config)
    let url = "https://api." + config.environment + "/api/v2/outbound/dnclists/" + dnclist + "/phonenumbers";

    // Create the request body as an object
    const requestBody = {
        action:"add",
        phoneNumbers: [phoneNumberToAdd],
        "expirationDateTime": "" // Replace 'phoneNumberToAdd' with the actual phone number you want to add
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "PATCH",
            beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(requestBody), // Convert the object to JSON
            success: function (result) {
                console.log(result);
                // Handle success here
                resolve(result);
            },
            error: function (request) {
                console.log("addNumberToDNC-error", request);
                // Handle errors here
                reject("addNumberToDNC -> " + JSON.stringify(request));
            }
        });
    });
}




function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
var button = document.getElementById("myButton");

        // Attach the function to the button's click event
 button.addEventListener("click", getActiveConversations(token));
