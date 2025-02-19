// src/BuilderOverlay.js
import React from "react";

const BuilderOverlay = ({
  builderCopy,
  typedText,
  setTypedText,
  filteredTreatments,
  handleAutocompleteChange,
  handleSelectTreatment,
  treatmentPlan,
  addTreatment,
  editing,
  setEditing,
  selectedTreatmentId,
}) => {
  return (
    <div className="treatment-card overlay">
      <h2>{builderCopy.headline}</h2>
      <p>{builderCopy.subheading}</p>

      {/* Autocomplete text field */}
      <div className="form-group">
        <label htmlFor="treatment-search">Treatment</label>
        <input
          id="treatment-search"
          type="text"
          placeholder="Search or select a treatment..."
          value={typedText}
          onChange={handleAutocompleteChange}
          className="autocomplete-input"
        />
      </div>

      {/* Filtered Treatment List */}
      {filteredTreatments.length > 0 ? (
        <div className="autocomplete-list">
          {filteredTreatments.map((t) => (
            <div
              key={t.id}
              className={`autocomplete-item ${
                selectedTreatmentId === t.id ? "selected" : ""
              }`}
              onClick={() => handleSelectTreatment(t)}
            >
              {t.name}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-matches">No matching treatments</p>
      )}

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
        {/* Show Add button if a valid treatment is selected */}
        {selectedTreatmentId && (
          <button className="btn primary" onClick={addTreatment}>
            Add Treatment
          </button>
        )}
      </div>
    </div>
  );
};

export default BuilderOverlay;