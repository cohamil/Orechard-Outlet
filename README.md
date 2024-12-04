# Devlog Entry: Formation - 11/15/2024

F Team Formation

### **Github**

Link: [https://github.com/cohamil/Orechard-Outlet](https://github.com/cohamil/Orechard-Outlet)

### **Introducing the Team**

* Tools Lead: Connor Hamilton  
* Engine Lead: Ani Sindhu  
* Design Lead:Yahli Kijel

### **Tools and Materials**

**1**. Tell us about what engines, libraries, frameworks, and or platforms you intend to use, and give us a tiny bit of detail about why your team chose those.

* Phaser, we chose this framework because we all have prior experience with Phaser in CMPM 120\. We liked the tools that are available with Phaser and believe that it is suitable for this project. Additionally, because we’ve been using TypeScript for this class, we wanted to pick a framework that supported this language.  

**2**. Tell us programming languages (e.g. TypeScript) and data languages (e.g. JSON) you team expects to use and why you chose them. Presumably you’ll just be using the languages expected by your previously chosen engine/platform.

* Our team will be using TypeScript to code this game and use JSON to contain object data. Phaser 3 natively supports Javascript, but the developer created supporting build and definitions files which allow for coding in Typescript. Since Typescript is kind of like an extension of Javascript, JSON is completely compatible with the language. 

**3**. Tell us about which tools you expect to use in the process of authoring your project. You might name the IDE for writing code, the image editor for creating visual assets, or the 3D editor you will use for building your scene. Again, briefly tell us why you made these choices. Maybe one of your teammates feels especially skilled in that tool or it represents something you all want to learn about.

* We decided to use VS Code to write code for our project since it is the IDE that we are all most familiar and comfortable with. For our visual assets, we will be using a mix of GIMP and Aesprite because it is what our groupmates feel most confident in.

**4**. Tell us about your alternate platform choice. Remember, your alternate platform must differ from your primary platform by either changing the primary language used or the engine/library/framework used for building your user interface.

* For our alternate choice, we decided to switch our desired language from TypeScript to JavaScript. Our reasoning behind this choice has to do with our desire to continue to use Phaser throughout the development of our project. By switching to another language that is supported by Phaser and similar to our original language, we believe that this alternative will be a smooth transition.

### **Outlook**

* What is your team hoping to accomplish that other teams might not attempt?  
  * Use the things you grow to create specialized requests from NPCs  
  * Combine the things you are growing, mutations for plants  
  * Rather than growing foods, grow ores used for tool creation  
  * Growing consumables that can increase growth rates and provide buffs, etc.

* What do you anticipate being the hardest or riskiest part of the project?  
  * Overscoping/setting the bar too high for what we want to develop  
    * Not giving ourselves enough time to integrate every idea that we come up with

* What are you hoping to learn by approaching the project with the tools and materials you selected above?  
  * We hope to learn more practical ways to implement common game design patterns in real examples where we start off from scratch (as opposed to given templates in the Demo assignments). None of us have had the pleasure of creating a systemic game like this, so we are all reveling the the opportunity. We have all coded in Phaser in CMPM120, but not to create a game like this. In all, we all hope to learn more about game programming through this experience.

### Credits
https://github.com/phaserjs/template-esbuild-ts
* Template used for setting up Phaser3 project with Typescript.


# Devlog Entry: F0 - 11/22/2024
### How we satisfied the software requirements
**a)** The game is displayed by a 2D grid. The player is able to navigate it with WASD to move from cell to cell. As of now, the grid is size 10x10 and the player moves 1 cell in the corresponding direction after each input.

**b)** The player can manually move time ahead by pressing "T" on their keyboard after doing whatever actions they wanted on their turn. After advancing time, plants may or may not grow and cells containing sun/water may or may not change based on specific conditions pertaining to the state of that cell and its neighbors.

**c)** The player can reap/sow plants in neighboring cells by using the Arrow Keys. For example, if the player uses the "UP" key, the cell above the player will either sow a plant if there is none or reap an existing one.

**d)** Cells may or may not have a sun value and water levels. The precense of these resources in a cell is randomized and depicted with what colors are inside each cell. Yellow indicates that the cell contains sun while a shade of blue indicates that the cell contains water. A light shade of blue means that there is a little amount of water in that cell while a dark shade of blue means there is more water. Cells may accumulate water as turns pass. Sun and Water can exist in the same cell and this is indicated by the cell's background displayed as half yellow and half blue.

**e)** Plants are currently depicted as small squares inside each cell. The color of each square represents the species of the plant and the size of the square represents its growth level. There are currently 3 different species of plants which can get upto a maximum growth level of 4.

**f)** There are different rules for advancing a plant to its next growth level. Plants start at level 1 once they are planted. The rules for advancing each level are as follows:
* For ALL Levels: The cell must have sun during that turn.
* Additional Level Specific Requirements:
    * To Level 2: The cell must have water during that turn.
    * To Level 3: The cell must have A LOT of water during that turn.
    * To Level 4: The cell must have A LOT of water and have no adjacent neighbors.
    
**g)** The current win condition is for the player to start a turn with at least 3 plants at growth level 4.

### Reflection
Coming into this, our team had a very solid plan of using Phaser3 as a framework to base our game on and code it using typecript. We had seen that Phaser3 supports typecript and given our experience with the platform from previous classes, we felt confident in our ability to make a game from scratch using this framework in typescript. We all knew how to translate between typescript and javascript, so that was an added bonus considering any possible project requirements. Since Phaser3 is an HTML5 type of framework and is based on javascript, we knew it would support JSON for storing object data. All of us have experience using Visual Studio Code so that was the agreed upon code editor. While we did consider using a dedicated IDE, the familiarity of VScode's enviroment provided enough comfort to proceed with the project. Overall, we did not make any major design changes and our experience so far has not led us wanting to.
