import React, { useState, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { treatments } from "./Data"; // Import treatments from Data.js

const TreatmentBuilder = ({ treatmentPlan, setTreatmentPlan }) => {
  // State to manage whether the treatment builder overlay is open
  const [editing, setEditing] = useState(false);

  // State for user input in the treatment selection field
  const [treatmentInput, setTreatmentInput] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");

  // Reference for the builder overlay transition
  const builderRef = useRef(null);

  // Handle user typing in the input field and check for an exact match
  const handleTreatmentInputChange = (e) => {
    const value = e.target.value;
    setTreatmentInput(value);

    // Check if input matches any treatment by name
    const match = treatments.find(
      (t) => t.name.toLowerCase() === value.toLowerCase()
    );
    setSelectedTreatmentId(match ? match.id : "");
  };

  // Function to add the selected treatment to the treatment plan
  const addTreatment = () => {
    if (selectedTreatmentId) {
      const treat = treatments.find((t) => t.id === selectedTreatmentId);
      const newItem = {
        id: treat.id,
        name: treat.name,
        quantity: 1, // Default quantity
      };

      // Add to the treatment plan
      setTreatmentPlan((prev) => [...prev, newItem]);

      // Reset inputs and close the builder overlay
      setTreatmentInput("");
      setSelectedTreatmentId("");
      setEditing(false);
    }
  };

  return (
    <>
      {/* Button to open the treatment builder */}
      <button className="btn secondary" onClick={() => setEditing(true)}>
        Add Treatment
      </button>

      {/* Overlay for selecting a treatment */}
      <CSSTransition
        in={editing || treatmentPlan.length === 0}
        timeout={300}
        classNames="fade-slide"
        unmountOnExit
        nodeRef={builderRef}
      >
        <div className="treatment-card overlay" ref={builderRef}>
          <h2>Add a Treatment</h2>
          <p>Enter the treatment you need and tap 'Add Treatment'.</p>

          <div className="form-group">
            <label htmlFor="treatment-input">Treatment</label>
            <input
              id="treatment-input"
              type="text"
              list="treatments-list"
              value={treatmentInput}
              onChange={handleTreatmentInputChange}
              placeholder="Start typing..."
              className="autocomplete-input"
            />
            <datalist id="treatments-list">
              {treatments.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </div>

          <div className="form-group inline">
            {/* Show "Back" button only if there are treatments */}
            {treatmentPlan.length > 0 && (
              <button
                className="btn secondary"
                onClick={() => setEditing(false)}
              >
                Back
              </button>
            )}
            {/* Show "Add Treatment" button only when a treatment is selected */}
            {selectedTreatmentId && (
              <button className="btn primary" onClick={addTreatment}>
                Add Treatment
              </button>
            )}
          </div>
        </div>
      </CSSTransition>
    </>
  );
};

export default TreatmentBuilder;
