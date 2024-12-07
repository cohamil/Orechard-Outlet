import { Scene } from "phaser";

import { PopupWindow } from './popup-window';
import { Grid, Coordinate } from './scenes/Game';

// plant.ts
export interface Plant {
    species: string;
    growthLevel: number;
    maxGrowthLevel: number;
    growthConditions: GrowthCondition[];
}

export interface GrowthCondition {
    requiredSun: number;
    requiredWater: number;
    requiredNeighbors: number;
}

// Enum to display Plant Names
export enum SpeciesName {
    "0xDA70D6" = "Lilac",
    "0x4CBB17" = "Daisy",
    "0xF28C28" = "Tulip",
}

// This manager handles all plant-related operations
export class PlantsManager {
    private plantSpecies: Plant[] = [];
    private scene: Scene; // Reference to the Phaser scene

    constructor(private maxSpeciesLength: number, scene: Scene) {
        this.scene = scene;
    }

    // Create a new plant species
    createSpecies(species: string, conditions: GrowthCondition[]): void {
        if (species.length !== this.maxSpeciesLength) {
            console.error("Incorrect species format. Not creating plant.\nGiven Species: " + species);
            return;
        }
        const newPlant: Plant = {
            species,
            growthLevel: 0,
            maxGrowthLevel: 3,
            growthConditions: conditions,
        };
        this.plantSpecies.push(newPlant);
    }

    // Interact with a plant in the given grid cell
    handlePlantInteraction(cell: Coordinate, grid: Grid): boolean {
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
    sowPlant(cell: Coordinate, grid: Grid) {
        const cellResource = grid[cell.row][cell.col];

        if (this.plantSpecies.length === 0) {
            console.error("No available plants to sow!");
            return;
        }

        const plantSpeciesIndex = Math.floor(Math.random() * this.plantSpecies.length);
        const newPlant: Plant = { ...this.plantSpecies[plantSpeciesIndex] };
        cellResource.plant = newPlant;
    }

    // Harvest a plant from a specific cell
    harvestPlant(cell: Coordinate, grid: Grid) {
        const cellResource = grid[cell.row][cell.col];
        cellResource.plant = null;
    }

    // Update plant growth mechanics
    updatePlantGrowth(cell: Coordinate, numMaxedPlants: number, grid: Grid): number {
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
    drawPlants(cellSize: number, startX: number, startY: number, cellColor: number, grid: Grid): void {
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cellResource = grid[row][col];
                const plant = cellResource.plant;

                if (plant) {
                    const plantColor = plant.species;
                    const plantSize = (cellSize * 0.4) * ((1 + plant.growthLevel) / plant.maxGrowthLevel); // Scale plant size based on growth
                    const x = startX + col * cellSize + (cellSize - plantSize) / 2;
                    const y = startY + row * cellSize + (cellSize - plantSize) / 2;

                    // Draw the plant
                    const plantRect = this.scene.add
                        .rectangle(x, y, plantSize, plantSize, parseInt(plantColor))
                        .setOrigin(0)
                        .setStrokeStyle(1, 0x000000);

                    // Plant interactivity: Add a popup window
                    let growthRequirementString;
                    if (plant.growthLevel === plant.maxGrowthLevel) {
                        growthRequirementString = "Plant is Fully Grown!";
                    } else {
                        const condition = plant.growthConditions[plant.growthLevel];
                        const neighborsString = condition.requiredNeighbors === -1 ? "Any" : condition.requiredNeighbors;
                        growthRequirementString = `Growth Requirements For Level Up:\nWater Level: ${condition.requiredWater}\nSun Level: ${condition.requiredSun}\nNumber of Neighbors: ${neighborsString}`;
                    }

                    const plantPopup = new PopupWindow(
                        this.scene,
                        this.scene.cameras.main.width / 2,
                        this.scene.cameras.main.height / 2,
                        700,
                        500,
                        "Plant Info",
                        `Species: ${SpeciesName[plant.species as keyof typeof SpeciesName]}\nMax Growth Level: ${plant.maxGrowthLevel}\nGrowth Level: ${plant.growthLevel}\n\n${growthRequirementString}`,
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
    private checkAdjacentFlowers(center: Coordinate, grid: Grid): number {
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
}