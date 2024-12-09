import { PopupWindow } from './popup-window';
import i18n from './i18n'; // Import i18next
import { gameManager } from './GameManager';

// This manager handles all plant-related operations
export class PlantsManager {
    constructor(scene) {
        this.scene = scene; // Reference to the Phaser scene
        this.plantSpecies = []; // Array to hold plant species
        this.harvestCount = {}; // Object to store the count of harvested plants for each species
        this.plantedSprites = []; // Array to hold drawn plant Sprites

        this.defaultGrowthCondition = { requiredSun: 1, requiredWater: 1, requiredNeighbors: -1 }
        this.MAX_GROWTH_CONDITIONS = 5;
    }

    // Create a new plant species
    createSpecies(species, maxLevel, conditions) {
        // Ensure species is a valid plant type
        if (!Object.values(SpeciesName).includes(species)) {
            console.error("Incorrect species name. Not creating plant.\nGiven Species: " + species);
            return;
        }
        const speciesHex = Object.entries(SpeciesName).find(([key, value]) => value == species)[0];

        // Ensure there are enough Growth Conditions
        if (maxLevel > conditions.length){
            // Fill conditions with defaults if not enough
            console.warn("Plant max level too high! Adding missing conditions.\nGiven Species: " + species);
            const previousConditionsLength = conditions.length;
            for (let i = previousConditionsLength; i < maxLevel; i+=1){
                conditions.push(this.defaultGrowthCondition);
            }
        }else if (maxLevel < conditions.length){
            console.warn("Too many Growth Conditions Given, increasing Plant's Max Level.\nGiven Species: " + species);
            maxLevel = conditions.length;
        }
        const newPlant = {
            species: speciesHex,
            growthLevel: 0,
            maxGrowthLevel: maxLevel,
            growthConditions: conditions,
        };
        this.plantSpecies.push(newPlant);
        this.harvestCount[SpeciesName[speciesHex]] = 0;
    }

    // Interact with a plant in the given grid cell
    handlePlantInteraction(cell, grid) {
        const cellResource = grid[cell.row][cell.col];
        // Plant a new plant if the cell is empty
        if (!cellResource.plant) {
            this.sowPlant(cell, grid);
            return true;
        } else {
            this.harvestPlant(cell, grid);
            return false;
        }
    }

    // Plant a new plant in a specific cell
    sowPlant(cell, grid) {
        const cellResource = grid[cell.row][cell.col];
        if (this.plantSpecies.length === 0) {
            console.error("No available plants to sow!");
            return;
        }
        const plantSpeciesIndex = Math.floor(Math.random() * this.plantSpecies.length);
        const newPlant = { ...this.plantSpecies[plantSpeciesIndex] };
        cellResource.plant = newPlant;
    }

    // Harvest a plant from a specific cell
    harvestPlant(cell, grid) {
        const cellResource = grid[cell.row][cell.col];

        // Add the harvested plant to the harvestedPlants array
        if (cellResource.plant.growthLevel === cellResource.plant.maxGrowthLevel) {
            this.incrementHarvestCount(SpeciesName[cellResource.plant.species]);
            gameManager.refreshUIElements();
        }

        cellResource.plant = null;
    }

    // Increment the harvest count for a species
    incrementHarvestCount(species) {
        if (!this.harvestCount[species]) {
            this.harvestCount[species] = 0;
        }
        this.harvestCount[species] += 1;
    }

    // Get the harvest count for a species
    getHarvestCount(species) {
        return this.harvestCount[species] || 0;
    }

    getHarvestedPlantsDisplay() {
        // Create string with number of each species harvested
        let displayString = "";
        for (const [species, count] of Object.entries(this.harvestCount)) {
            displayString += `${count}\n\n`;
        }
        return displayString;
    }

    // Update plant growth mechanics
    updatePlantGrowth(cell, numMaxedPlants, grid) {
        const cellResource = grid[cell.row][cell.col];
        const plant = cellResource.plant;
        if (!plant || plant.growthLevel === plant.maxGrowthLevel) return numMaxedPlants;
        const condition = plant.growthConditions[plant.growthLevel];
        if (
            cellResource.water >= condition.requiredWater &&
            cellResource.sun >= condition.requiredSun &&
            (condition.requiredNeighbors === -1 || condition.requiredNeighbors === this.checkAdjacentFlowers(cell, grid))
        ) {
            plant.growthLevel += 1;
            if (plant.growthLevel === plant.maxGrowthLevel) {
                numMaxedPlants += 1;
            }
            cellResource.water -= 1;
        }
        return numMaxedPlants;
    }

    // Draw plants on the grid
    drawPlants(cellSize, startX, startY, cellColor, grid) {
        // Remove previously drawn sprites
        this.plantedSprites.forEach(sprite => {
            sprite.destroy();
        })
        this.plantedSprites = [];
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cellResource = grid[row][col];
                const plant = cellResource.plant;
                if (plant) {
                    const plantColor = plant.species;
                    const plantSize = (80/cellSize) * ((4) / (1 + plant.maxGrowthLevel)); // Scale plant size based on growth
                    const x = startX + col * cellSize + (cellSize - plantSize) / 2;
                    const y = startY + row * cellSize + (cellSize - plantSize) / 2;
                    // Draw the plant
                    const numSprites = this.scene.textures.get(SpeciesName[plantColor]).getFrameNames().length;
                    const newSprite = this.scene.add.sprite(x, y, SpeciesName[plantColor], Math.min(plant.growthLevel,numSprites-1)).setOrigin(0.5,0.5).setScale(cellSize/80);
                    this.plantedSprites.push(newSprite);
                    /*const plantRect = this.scene.add
                        .rectangle(x, y, plantSize, plantSize, parseInt(plantColor))
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);*/
                    // Plant interactivity: Add a popup window
                    let growthRequirementString;
                    if (plant.growthLevel === plant.maxGrowthLevel) {
                        growthRequirementString = i18n.t('plant_fully_grown');
                    } else {
                        const condition = plant.growthConditions[plant.growthLevel];
                        const neighborsString = condition.requiredNeighbors === -1 ? i18n.t('any') : condition.requiredNeighbors;
                        growthRequirementString = `${i18n.t('growth_requirements')}:\n${i18n.t('water_level')}: ${condition.requiredWater}\n${i18n.t('sun_level')}: ${condition.requiredSun}\n${i18n.t('number_of_neighbors')}: ${neighborsString}`;
                    }
                    const plantPopup = new PopupWindow(
                        this.scene,
                        this.scene.cameras.main.width / 2,
                        this.scene.cameras.main.height / 2,
                        700,
                        500,
                        i18n.t('plant_info'),
                        `${i18n.t('species')}: ${i18n.t('species_' + SpeciesName[plant.species])}\n${i18n.t('max_growth_level')}: ${plant.maxGrowthLevel}\n${i18n.t('growth_level')}: ${plant.growthLevel}\n\n${growthRequirementString}`,
                        {
                            fontFamily: "Arial Black",
                            fontSize: 24,
                            color: "#ffffff",
                            stroke: "#000000",
                            strokeThickness: 6,
                        }
                    );
                    plantPopup.setVisibility(false);
                    // Make the cell containing the plant interactive
                    this.scene.add.rectangle(x - 27, y - 27, cellSize - 3, cellSize - 3, cellColor)
                        .setOrigin(0)
                        .setAlpha(0.0001)
                        .setInteractive()
                        .on('pointerup', () => plantPopup.setVisibility(true));
                }
            }
        }
    }

    // Check adjacent cells for plants
    checkAdjacentFlowers(center, grid) {
        const adjacentCells = [
            { row: center.row - 1, col: center.col }, // Up
            { row: center.row + 1, col: center.col }, // Down
            { row: center.row, col: center.col - 1 }, // Left
            { row: center.row, col: center.col + 1 }, // Right
        ];
        let numAdjacentPlants = 0;
        for (const cell of adjacentCells) {
            if (
                cell.row >= 0 &&
                cell.row < grid.length &&
                cell.col >= 0 &&
                cell.col < grid[0].length
            ) {
                const adjacentPlant = grid[cell.row][cell.col].plant;
                if (adjacentPlant) numAdjacentPlants += 1;
            }
        }
        return numAdjacentPlants;
    }

    getMaxConditions(){
        return this.MAX_GROWTH_CONDITIONS;
    }
}

// Plant species names map. MUST use a hex code to define color
export const SpeciesName = {
    "0xDA70D6": "lilac",
    "0x4CBB17": "daisy",
    "0xF28C28": "tulip",
}


// SAMPLE CODE TO CREATE A PLANT
