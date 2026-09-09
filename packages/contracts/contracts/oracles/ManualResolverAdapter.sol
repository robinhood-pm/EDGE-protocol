// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IResolutionOracle.sol";

contract ManualResolverAdapter is IResolutionOracle, Ownable {
    enum ResolutionStatus { NONE, PROPOSED, RESOLVED }

    struct MarketResolution {
        uint8 proposedOutcome;
        uint256 proposalTime;
        ResolutionStatus status;
        uint8 finalOutcome;
    }

    uint256 public constant DISPUTE_WINDOW = 24 hours;
    
    mapping(uint256 => MarketResolution) public resolutions;

    event OutcomeProposed(uint256 indexed marketId, uint8 proposedOutcome, uint256 timestamp);
    event OutcomeDisputed(uint256 indexed marketId, uint8 newProposedOutcome);
    event MarketResolved(uint256 indexed marketId, uint8 finalOutcome);

    constructor() Ownable(msg.sender) {}

    function proposeOutcome(uint256 marketId, uint8 outcome) external onlyOwner {
        require(outcome == 0 || outcome == 1, "Invalid outcome");
        MarketResolution storage res = resolutions[marketId];
        require(res.status == ResolutionStatus.NONE, "Already proposed or resolved");

        res.proposedOutcome = outcome;
        res.proposalTime = block.timestamp;
        res.status = ResolutionStatus.PROPOSED;

        emit OutcomeProposed(marketId, outcome, block.timestamp);
    }

    function disputeOutcome(uint256 marketId, uint8 newOutcome) external onlyOwner {
        require(newOutcome == 0 || newOutcome == 1, "Invalid outcome");
        MarketResolution storage res = resolutions[marketId];
        require(res.status == ResolutionStatus.PROPOSED, "No active proposal");
        require(block.timestamp < res.proposalTime + DISPUTE_WINDOW, "Dispute window closed");

        res.proposedOutcome = newOutcome;
        res.proposalTime = block.timestamp; // Reset window

        emit OutcomeDisputed(marketId, newOutcome);
    }

    function executeOutcome(uint256 marketId) external {
        MarketResolution storage res = resolutions[marketId];
        require(res.status == ResolutionStatus.PROPOSED, "No active proposal");
        require(block.timestamp >= res.proposalTime + DISPUTE_WINDOW, "Dispute window still open");

        res.status = ResolutionStatus.RESOLVED;
        res.finalOutcome = res.proposedOutcome;

        emit MarketResolved(marketId, res.finalOutcome);
    }

    function isResolved(uint256 marketId) external view override returns (bool) {
        return resolutions[marketId].status == ResolutionStatus.RESOLVED;
    }

    function getOutcome(uint256 marketId) external view override returns (uint8) {
        require(resolutions[marketId].status == ResolutionStatus.RESOLVED, "Not resolved yet");
        return resolutions[marketId].finalOutcome;
    }
}
