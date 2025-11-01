// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SavingsCircle } from "./SavingsCircle.sol";

/**
 * @title SavingsCircleFactory
 * @notice Factory contract responsible for deploying and indexing new SavingsCircle instances.
 * @dev This contract allows users to create and register their own SavingsCircle (tanda) smart contracts.
 *      It also tracks all tandas globally and by user, separating those created by the user and those joined as a participant.
 *
 * Key responsibilities:
 * - Deploy new `SavingsCircle` contracts with custom parameters.
 * - Track all created tandas.
 * - Maintain mappings for tandas created by users and tandas in which they participate.
 * - Emit transparent on-chain events for off-chain UI integration.
 *
 * Security considerations:
 * - Each created `SavingsCircle` is fully independent and owned by its creator.
 * - This factory does NOT hold or manage funds.
 * - All ownership logic is delegated to the deployed `SavingsCircle` contracts.
 */
contract SavingsCircleFactory {
    // ──────────────────────────────
    // STATE VARIABLES
    // ──────────────────────────────

    /// @notice Stores all deployed SavingsCircle contract addresses.
    address[] public allCircles;

    /// @notice Maps a user's address to the list of SavingsCircles they have created.
    mapping(address => address[]) public userCircles;

    /// @notice Maps a user's address to the list of SavingsCircles they have joined as participants.
    mapping(address => address[]) public participantCircles;

    /// @notice The owner of this factory contract (optional governance role).
    address public owner;

    // ──────────────────────────────
    // EVENTS
    // ──────────────────────────────

    /**
     * @notice Emitted when a new SavingsCircle contract is successfully created.
     * @param creator The address of the user who deployed the SavingsCircle.
     * @param circleAddress The address of the newly created SavingsCircle contract.
     * @param name The name of the SavingsCircle (tanda).
     * @param image The image or IPFS hash associated with the SavingsCircle.
     * @param contributionAmount The fixed contribution amount (in wei) per participant per round.
     * @param maxParticipants The maximum number of participants allowed in the circle.
     * @param roundDuration The duration (in seconds) for each savings round.
     */
    event CircleCreated(
        address indexed creator,
        address indexed circleAddress,
        string name,
        string image,
        uint256 contributionAmount,
        uint256 maxParticipants,
        uint256 roundDuration
    );

    /**
     * @notice Emitted when a user joins a SavingsCircle contract as a participant.
     * @param user The address of the participant who joined the circle.
     * @param circleAddress The address of the SavingsCircle the user joined.
     */
    event UserJoinedCircle(address indexed user, address indexed circleAddress);

    // ──────────────────────────────
    // MODIFIERS
    // ──────────────────────────────

    /**
     * @dev Restricts access to the factory owner.
     * Useful for potential administrative extensions in future versions.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not factory owner");
        _;
    }

    // ──────────────────────────────
    // CONSTRUCTOR
    // ──────────────────────────────

    /**
     * @notice Initializes the factory and assigns the contract deployer as the owner.
     */
    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────────
    // CORE LOGIC
    // ──────────────────────────────

    /**
     * @notice Deploys a new `SavingsCircle` (tanda) with the specified parameters.
     * @dev The created circle is automatically assigned to the creator as the owner.
     *
     * Emits a {CircleCreated} event.
     *
     * @param _name The public name of the tanda.
     * @param _image A URI or IPFS hash representing the tanda’s visual identity.
     * @param _contributionAmount The amount (in wei) each participant must contribute per round.
     * @param _maxParticipants The maximum number of participants allowed in the tanda.
     * @param _roundDuration The duration of each round in seconds (e.g., one week = 604800 seconds).
     * @param _insuranceDeposit The optional insurance deposit amount (in wei) required from each participant.
     * 
     *
     * @return circleAddress The blockchain address of the newly created SavingsCircle contract.
     */
    function createSavingsCircle(
        string memory _name,
        string memory _image,
        uint256 _contributionAmount,
        uint256 _maxParticipants,
        uint256 _roundDuration,
        uint256 _insuranceDeposit
    ) external returns (address circleAddress) {
        SavingsCircle newCircle = new SavingsCircle(
            _name,
            _image,
            _contributionAmount,
            _maxParticipants,
            _roundDuration,
            _insuranceDeposit,
            address(this) 
        );
        newCircle.transferOwnership(msg.sender);
        circleAddress = address(newCircle);
        allCircles.push(circleAddress);
        userCircles[msg.sender].push(circleAddress);
        emit CircleCreated(
            msg.sender,
            circleAddress,
            _name,
            _image,
            _contributionAmount,
            _maxParticipants,
            _roundDuration
        );
    }

    /**
     * @notice Registers a user's participation in a `SavingsCircle`.
     * @dev This function can only be called by a legitimate `SavingsCircle` contract.
     *
     * Emits a {UserJoinedCircle} event.
     *
     * @param _user The participant’s address joining the tanda.
     */
    function registerParticipation(address _user) external {
        require(_user != address(0), "Invalid user address");
        participantCircles[_user].push(msg.sender);
        emit UserJoinedCircle(_user, msg.sender);
    }

    // ──────────────────────────────
    // VIEW FUNCTIONS
    // ──────────────────────────────

    /**
     * @notice Returns the list of all deployed `SavingsCircle` addresses.
     * @return An array of all created SavingsCircle contracts.
     */
    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }

    /**
     * @notice Returns the list of `SavingsCircle` contracts created by a specific user.
     * @param user The address of the creator.
     * @return An array of SavingsCircle addresses created by the given user.
     */
    function getCirclesByUser(address user) external view returns (address[] memory) {
        return userCircles[user];
    }

    /**
     * @notice Returns the list of `SavingsCircle` contracts in which a user participates.
     * @param user The address of the participant.
     * @return An array of SavingsCircle addresses where the user is a member.
     */
    function getCirclesByParticipant(address user) external view returns (address[] memory) {
        return participantCircles[user];
    }

    /**
     * @notice Returns the total number of deployed SavingsCircles.
     * @return The total count of all tandas created by this factory.
     */
    function getTotalCircles() external view returns (uint256) {
        return allCircles.length;
    }
}
