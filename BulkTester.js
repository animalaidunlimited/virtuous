/***********************************************************************************************************************
* Author: Jim Mackenzie
* Date: 16/Feb/2022
* Description: This script is will get the total donation amount for a list of emails stored in a Google Sheet.
*
* Please be aware that the Virtuous API has alimit of 1000 calls per hour.
*
* PARAMETERS TO SET
*
* username: This is the Virtuous username you want to hit the API with. It is suggested you create a new user and
* allow minimal privileges for this account.
*
* password: The password for the above account. DO NOT SHARE YOUR PASSWORD
*
* emailColumn: This is the column in your spreadsheet where the emails of your users lives.
*
* resultColumn: This is where you want the amount retrieved from Virtuous to be stored.
*
/***********************************************************************************************************************/

function myFunction() {

  //Set the username and password for the user you're logging into Virtuous as. We'll use this to get an access token.
  const username = '<enter your Virtuous username>';
  const password = '<enter your Virtuous password>';

  //Set the column that has the email address in it
  const emailColumn = 'D';

  //Set the column that you want the results to land in
  const resultColumn = 'L'

  //Get the width of the range, we'll use this the skip rows that already have a value
  const arraySize = resultColumn.charCodeAt(0) - emailColumn.charCodeAt(0);

  //Get all of the rows we're interested in
  const rows = SpreadsheetApp.getActiveSheet().getRange(`${emailColumn}2:${resultColumn}`).getValues();

  //Get ourselves an authentication token from the server
  const token = getToken(username, password);

  //Set the endpoint fromn the API we want to hit
  let baseURL = 'https://api.virtuoussoftware.com/api/Contact/Find';

  //Set the headers of the request. Here we need to set the Authorization header with the token we retrieved before
  let headers = {'Authorization': `bearer ${token}`};

  let options = {
  'headers' : headers
  }


    //For each email in our list make a call to the enppoint we selected above
    for([index, row] of rows.entries()){

    //This row either has an empty email field or already has a value, so let's skip it
    if(row[0].length == 0 || row[arraySize].toString().length != 0 ){
      continue;
    }

        let url = baseURL + '?email=' + row[0];

        let response = {lifeToDateGiving: '-1'};

        //Get the results from the API and catch any errors
        try{
          response = JSON.parse(UrlFetchApp.fetch(url, options));
        }
        catch(error){
          console.log();
        }

        //Get the life to date giving value and remove the currency symbol
        let lifeToDateGiving = response.lifeToDateGiving.replace('$','').replace(',','');

        //Save the value to the result column
        SpreadsheetApp.getActiveSheet().getRange(resultColumn + (index + 2)).setValue(lifeToDateGiving);

        //Every 10 calls let's write the results to the spreadsheet
        if(index % 10 == 0){
          SpreadsheetApp.flush();
        }

      }

}

function getToken(username, password) {

  const baseURL = 'https://api.virtuoussoftware.com/Token'

  const formData = {'grant_type' : 'password', 'username' : username, 'password' : password};

  var options = {
    'method' : 'post',
    'payload' : formData
  };

  let response = JSON.parse(UrlFetchApp.fetch(baseURL, options));

  return response.access_token;

}
