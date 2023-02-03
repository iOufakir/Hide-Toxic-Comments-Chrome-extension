// window.addEventListener('popstate', async () => {
//    await init();
// });

let observer = null;
window.addEventListener("load", async () => {
   await init();
});


const init = async () => {
   const commentsBlockInterval = setInterval(async () => {
      const commentSection = await getElementByXpath("//div[2]/main/div/div/div/div[1]/div/section/div/div");
      if (commentSection) {
         await loopAndHideComments(commentSection);
         clearInterval(commentsBlockInterval);
      }
   }, 1000);


   setTimeout(() => {
      let previousStyles = null;
      // Detect when user click on a specific tweet (SPA)
      setInterval(async () => {
         const commentSection = await getElementByXpath("//div[2]/main/div/div/div/div[1]/div/section/div/div");
         if (commentSection) {
            const currentStyles = await commentSection.style;

            // Styles changed after clicking on specific tweet
            if (previousStyles !== currentStyles) {
               previousStyles = currentStyles;
               await loopAndHideComments(commentSection);
               //console.info('New Tweet!');
            }
         }
      }, 500);
   }, 4000);
}

const loopAndHideComments = async (commentSection) => {
   const comments = await commentSection.querySelectorAll("div[data-testid='tweetText']");
   // Starting from index 1, bcs the post also use article with the same data test id.
   if (comments && comments.length > 1) {
      for (let i = 1; i < comments.length; i++) {
         const comment = await comments[i];
         await hideComment(comment);
      }
   }
   await observeComments(commentSection);
}

const observeComments = async (commentSection) => {
   if (observer) {
      observer.disconnect();
   }
   // Create an observer to check for new comments
   observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
         // Check if the childList has changed
         if (mutation.type === "childList") {
            //console.info('Observer called!');
            mutation.addedNodes.forEach(async (node) => {
               const comment = await node.querySelector("div[data-testid='tweetText']");
               await hideComment(comment);
            });
         }
      });
   });
   //console.log('call observer function');
   observer.observe(commentSection, { childList: true });
};


getElementByXpath = (path) =>
   document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;


const hideComment = async (node) => {
   const commentText = getCommentText(node);
   const isCommentBlockDisplayed = node && window.getComputedStyle(node).display === 'block' && !node.querySelector('.show-tweet-comment-btn');

   if (commentText && commentText.length > 1 && isCommentBlockDisplayed) {
      if (await isCommentNegative(commentText)) {
         node.style.display = "none";
         createActionButton("Display Sensitive Comment", node);
      }
   }
}

const getCommentText = (node) => node?.querySelector("div[data-testid='tweetText'] > span")?.textContent?.trim();


const isCommentNegative = async (commentText) =>
   fetch('http://localhost:8082/api/users/1/comment/check', {
      method: 'POST',
      mode: 'cors',
      headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Basic dXNlcjp1c2VyUGFzcw==',
      },
      body: JSON.stringify({
         text: commentText
      }),
   }).then(response => response.json());


const buildBtnStyle = () => {
   const newButton = document.createElement('button');
   newButton.style.maxWidth = '16rem';
   newButton.style.opacity = 1;
   newButton.style.cursor = 'pointer';
   newButton.style.marginTop = '1rem';
   newButton.style.marginBottom = '1rem';
   newButton.style.marginBottom = '1rem';
   newButton.style.color = 'white';
   newButton.style.fontWeight = 600;
   newButton.style.justifyContent = 'center';
   newButton.style.backgroundColor = 'rgb(29, 155, 240)';
   newButton.style.paddingLeft = '1.8rem';
   newButton.style.paddingRight = '1.8rem';
   newButton.style.minHeight = '2.2rem';
   newButton.style.border = 0;
   newButton.style.borderRadius = '2.8rem';
   return newButton;
}

const createActionButton = (btnText, node) => {
   const newButton = buildBtnStyle();
   newButton.innerHTML = btnText;
   newButton.classList = "show-tweet-comment-btn ";
   node.parentNode.appendChild(newButton);

   newButton.addEventListener('click', (event) => {
      node.style.display = "block";
   });
}