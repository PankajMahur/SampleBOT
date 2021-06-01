
const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const AdaptiveCard = require('../resources/adaptiveCard');

const CARDS =[
    AdaptiveCard
];

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';

class MakeReservationDialog extends ComponentDialog {
    
    constructor(conservsationState,userState) {
        super('makeReservationDialog');



this.addDialog(new TextPrompt(TEXT_PROMPT,this.nameValidator));
this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.noOfParticipantsValidator));
this.addDialog(new DateTimePrompt(DATETIME_PROMPT));


this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
    this.firstStep.bind(this),  // Ask confirmation if user wants to make reservation?
    this.getName.bind(this),    // Get name from user
    this.getNumberOfParticipants.bind(this),  // Number of participants for reservation
    //this.getDate.bind(this), // Date of reservation
    //this.getTime.bind(this),  // Time of reservation
    this.showCardStep.bind(this),
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
    this.summaryStep.bind(this)
           
]));




this.initialDialogId = WATERFALL_DIALOG;
this.stepTurnContext={};


   }

   async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    this.stepTurnContext = dialogContext;
    const results = await dialogContext.continueDialog();
    //console.log(results.status);
    if (results.status === DialogTurnStatus.empty) {
        
        await dialogContext.beginDialog(this.id);
    }
}

async firstStep(step) {
endDialog = false;
// Running a prompt here means the next WaterfallStep will be run when the users response is received.
return await step.prompt(CONFIRM_PROMPT, 'Would you like to make a reservation?', ['yes', 'no']);
      
}

async getName(step){
     
    
    if(step.result === true)
    { 
    return await step.prompt(TEXT_PROMPT, 'In what name reservation is to be made?');
    }
    else
    {
    endDialog = true;
      return await step.endDialog();
    }

}

async getNumberOfParticipants(step){
     
    step.values.name = step.result
    return await step.prompt(NUMBER_PROMPT, 'How many participants ( 1 - 150)?');
}



async showCardStep(step){
    //console.log(step.result);
    step.values.noOfParticipants = step.result;
    await step.context.sendActivity({ text:'Please choose your day and time',attachments: [CardFactory.adaptiveCard(CARDS[0])] });
    /*
    Natively, Adaptive Cards don't work like prompts. With a prompt, the prompt will display 
    and wait for user input before continuing. But with Adaptive Cards (even if it contains an input box and a submit button), 
    there is no code in an Adaptive Card that will cause a Waterfall Dialog to wait for user input before continuing the dialog.
    So, if you're using an Adaptive Card that takes user input, you generally want to handle whatever the user submits outside of the context of a Waterfall Dialog.
    if you want to use an Adaptive Card as part of a Waterfall Dialog, there is a workaround. Basically, you:
    Display the Adaptive Card
    Display a Text Prompt
    Convert the user's Adaptive Card input into the input of a Text Prompt
    */
    return await step.prompt(TEXT_PROMPT, '');
}

async getDate(step){

    
    step.values.noOfParticipants = step.result

    return await step.prompt(DATETIME_PROMPT, 'On which date you want to make the reservation?')
}

async getTime(step){

    step.values.date = step.result

    return await step.prompt(DATETIME_PROMPT, 'At what time?')
}


async confirmStep(step){

    var dateTimeValue = step.context.activity.value;
    step.values.time = dateTimeValue.reservationTime;
    step.values.date = dateTimeValue.reservationDate;
    var msg = `You have entered following values: \n Name: ${step.values.name}\n Participants: ${step.values.noOfParticipants}\n Date: ${step.values.date}\n Time: ${step.values.time}`

    await step.context.sendActivity(msg);

    return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to make the reservation?', ['yes', 'no']);
}

async summaryStep(step){

    
    if(step.result===true)
    {
      // Business 

      await step.context.sendActivity("Reservation successfully made. Your reservation id is : 12345678")
      endDialog = true;
      return await step.endDialog();   
    
    }


   
}


async noOfParticipantsValidator(promptContext) {    
    // This condition is our validation rule. You can also change the value at this point.  
    if(sendInvalidEntryActivity(promptContext))   
    return promptContext.recognized.succeeded && checkForNumberOfParticipants(promptContext);
}

async nameValidator(promptContext){   
    var regex = /^[a-zA-Z ]{2,30}$/;    
    promptContext.recognized.succeeded = regex.test(promptContext.recognized.value); 
    if(sendInvalidEntryActivity(promptContext))
    return regex.test(promptContext.recognized.value);
}

async isDialogComplete(){
    return endDialog;
}
}

checkForNumberOfParticipants=function(promptContext)
{
    var activityMessage = "";
    if(promptContext.recognized.value < 1 || promptContext.recognized.value > 150)
    {
      promptContext.context.sendActivity("Sorry the number of participants are either too less or more than we can serve");
      return false;
    }
    else
    return true;

}

sendInvalidEntryActivity=function(promptContext)
{
    var result = true;
    if(!promptContext.recognized.succeeded)
    {       
    promptContext.context.sendActivity("oops sorry, that was an invalid entry, let's try again");    
    result = false;
    }
    return result;
}

module.exports.MakeReservationDialog = MakeReservationDialog;








